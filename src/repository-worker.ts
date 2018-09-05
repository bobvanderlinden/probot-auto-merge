import { WaitQueue } from './WaitQueue'
import { RepositoryReference } from './github-models'
import { HandlerContext } from './models'
import { handlePullRequest } from './pull-request-handler'

export class RepositoryWorker {
  private waitQueue: WaitQueue<number>
  private context: HandlerContext

  constructor (
    public repository: RepositoryReference,
    context: HandlerContext,
    onDrain: () => void
  ) {
    this.context = {
      ...context,
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
      reschedulePullRequest: () => {
        this.waitQueue.queueFirst(pullRequestNumber, 60 * 1000)
      }
    }
    return handlePullRequest(pullRequestContext, pullRequestReference)
  }

  public queue (pullRequestNumber: number) {
    this.waitQueue.queueLast(pullRequestNumber)
  }
}
