import { WaitQueue } from './WaitQueue'
import { RepositoryReference, PullRequestReference } from './github-models'
import { HandlerContext } from './models'
import { handlePullRequest } from './pull-request-handler'

type RepositoryContext = HandlerContext & { repository: RepositoryReference }

export class RepositoryWorker {
  private waitQueue: WaitQueue<number>
  private context: RepositoryContext

  constructor (
    public repository: RepositoryReference,
    context: HandlerContext,
    onDrain: () => void,
    private onPullRequestError: (pullRequestReference: PullRequestReference, error: any) => void
  ) {
    this.context = {
      ...context,
      repository,
      log: context.log.child({
        options: {
          owner: repository.owner,
          repo: repository.repo
        }
      })
    }
    this.waitQueue = new WaitQueue<number>(
      (pullRequestNumber: number) => `${pullRequestNumber}`,
      this.handlePullRequestNumber.bind(this),
      onDrain
    )
  }

  private async handlePullRequestNumber (pullRequestNumber: number): Promise<void> {
    const log = this.context.log.child({
      options: {
        pullRequest: pullRequestNumber
      }
    })
    const pullRequestReference = {
      ...this.repository,
      number: pullRequestNumber
    }
    const pullRequestContext = {
      ...this.context,
      log,
      pullRequest: pullRequestReference,
      reschedulePullRequest: () => {
        this.waitQueue.queueFirst(pullRequestNumber, 60 * 1000)
      }
    }
    try {
      await handlePullRequest(pullRequestContext, pullRequestReference)
    } catch (err) {
      this.onPullRequestError(pullRequestReference, err)
    }
  }

  public queue (pullRequestNumber: number) {
    this.waitQueue.stopWaitingFor(`${pullRequestNumber}`)
    this.waitQueue.queueLast(pullRequestNumber)
    this.context.log.debug(`Queued ${pullRequestNumber}`, {
      current: this.waitQueue.currentTask(),
      queued: this.waitQueue.getQueuedTasks()
    })
  }
}
