import Raven from 'raven'
import { WaitQueue } from './WaitQueue'
import { RepositoryReference, PullRequestReference } from './github-models'
import { handlePullRequest, PullRequestContext } from './pull-request-handler'
import { WorkerContext } from './models'

export class RepositoryWorker {
  private waitQueue: WaitQueue<number>
  private context: WorkerContext

  constructor (
    public repository: RepositoryReference,
    context: WorkerContext,
    onDrain: () => void,
    private onPullRequestError: (pullRequestReference: PullRequestReference, error: any) => void
  ) {
    this.context = context
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
    const pullRequestContext: PullRequestContext = {
      github: await this.context.createGitHubAPI(),
      log,
      config: this.context.config,
      reschedulePullRequest: (delay: number = 60 * 1000) => {
        this.waitQueue.queueFirst(pullRequestNumber, delay)
      },
      startedAt: new Date()
    }
    await Raven.context({
      extra: { pullRequestReference }
    }, async () => {
      try {
        await handlePullRequest(pullRequestContext, pullRequestReference)
      } catch (err) {
        this.onPullRequestError(pullRequestReference, err)
      }
    })
  }

  public queue (pullRequestNumber: number) {
    this.waitQueue.stopWaitingFor(pullRequestNumber)
    this.waitQueue.queue(pullRequestNumber)
    this.context.log.debug(`Queued ${pullRequestNumber}`, {
      current: this.waitQueue.currentTask(),
      queued: this.waitQueue.getQueuedTasks()
    })
  }

  public getCurrentTask () {
    return this.waitQueue.currentTask()
  }

  public getQueuedTasks () {
    return this.waitQueue.getQueuedTasks()
  }
}
