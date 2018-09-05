import { PullRequestReference } from '../lib/github-models'
import { PullRequestContext } from '../lib/pull-request-handler'
import { CancelablePromise, delay } from './delay'
import { RepositoryReference } from './github-models'
import { HandlerContext } from './models'

type HandleTask = {
  type: 'handle',
  pullRequest: number
}

type WaitTask = {
  type: 'wait',
  pullRequest: number
}

type RepositoryTask = HandleTask | WaitTask

type RunningTask = RepositoryTask & {
  promise: CancelablePromise<void>
}

export class RepositoryWorker {
  taskQueue: RepositoryTask[] = []
  runner: Promise<void> | null = null
  runningTask: RunningTask | null = null
  private context: HandlerContext

  constructor (
    public repository: RepositoryReference,
    context: HandlerContext,
    private pullRequestHandler: (context: PullRequestContext, pullRequest: PullRequestReference) => Promise<void>
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
  }

  async run (): Promise<void> {
    while (await this.runTask());
    this.runner = null
  }

  private async runTask (): Promise<boolean> {
    const task = this.taskQueue.shift()
    if (task === undefined) {
      this.runner = null
      return false
    }

    this.runningTask = {
      ...task,
      promise: this.executeTask(task)
    }
    await this.runningTask.promise
    this.runningTask = null

    return true
  }

  private executeTask (task: RepositoryTask): CancelablePromise<void> {
    const log = this.context.log.child({
      options: {
        pullRequest: task.pullRequest
      }
    })
    switch (task.type) {
      case 'wait':
        log.info(`Waiting for 1 minute`)
        return delay(1 * 60 * 1000) // 1 minute
      case 'handle':
        log.debug('Handling pull request')
        const pullRequestReference = {
          ...this.repository,
          number: task.pullRequest
        }
        const pullRequestContext = {
          ...this.context,
          log,
          reschedulePullRequest: this.reschedulePullRequest.bind(this, task)
        }
        return this.pullRequestHandler(pullRequestContext, pullRequestReference)
      default:
        log.error(`Invalid task type (${(task as any).type})`)
        throw new Error(`Invalid task type (${(task as any).type})`)
    }
  }

  private reschedulePullRequest (task: RepositoryTask) {
    this.taskQueue.unshift(task)
    this.taskQueue.unshift({
      type: 'wait',
      pullRequest: task.pullRequest
    })
  }

  private startOrResume () {
    if (this.runner) { return }
    this.runner = this.run().then()
  }

  public queue (task: RepositoryTask) {
    this.context.log.debug(`Handling queue request type ${task.type} for pull request #${task.pullRequest}`)
    // If a pull request is attempted to be queued while we were currently waiting for that same pull request,
    // stop waiting for the pull request.
    if (this.runningTask
      && this.runningTask.type === 'wait'
      && this.runningTask.pullRequest === task.pullRequest
      && this.runningTask.promise.cancel
    ) {
      this.context.log.debug(`Cancelling waiting for pull request #${task.pullRequest}`)
      this.runningTask.promise.cancel()
      return
    }

    // If the task was already in the queue, skip adding the task.
    if (this.taskQueue.some(queuedTask =>
      queuedTask.type === task.type && queuedTask.pullRequest === task.pullRequest
    )) {
      this.context.log.debug(`Pull request #${task.pullRequest} was already in queue. Skip adding it again.`)
      return
    }
    this.taskQueue.push(task)
    this.startOrResume()
  }
}
