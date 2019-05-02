import { WaitQueue } from './WaitQueue'
import { RepositoryReference, PullRequestReference } from './github-models'
import { handlePullRequest, PullRequestContext } from './pull-request-handler'
import { WorkerContext } from './models'
import { metricsReporter } from './metrics'

export class RepositoryWorker {
  private waitQueue: WaitQueue<number>
  private context: WorkerContext
  public sendMetricsInterval?: NodeJS.Timeout

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
      () => {
        this.sendMetricsInterval && clearInterval(this.sendMetricsInterval)
        this.sendQueueSizeMetrics()
        onDrain()
      }
    )

    metricsReporter.enabled &&
      (this.sendMetricsInterval = setInterval(
        this.sendQueueSizeMetrics.bind(this),
        1000
      ))
  }

  private sendQueueSizeMetrics (): void {
    metricsReporter.queueSizeGauge.set(
      { owner: this.repository.owner, repo: this.repository.repo },
      this.waitQueue.getQueuedTasks().length
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
    try {
      await handlePullRequest(pullRequestContext, pullRequestReference)
    } catch (err) {
      this.onPullRequestError(pullRequestReference, err)
    }
  }

  public queue (pullRequestNumber: number) {
    this.waitQueue.stopWaitingFor(pullRequestNumber)
    this.waitQueue.queue(pullRequestNumber)
    this.context.log.debug(`Queued ${pullRequestNumber}`, {
      current: this.waitQueue.currentTask(),
      queued: this.waitQueue.getQueuedTasks()
    })
  }
}
