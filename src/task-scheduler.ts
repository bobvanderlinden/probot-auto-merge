import PQueue from 'p-queue'
const debug = require('debug')('task-scheduler')

export type TaskWorker<TTask> = (task: TTask) => Promise<void>

export type QueueErrorHandler = (error: any, queueName: string) => void

const defaultErrorHandler: QueueErrorHandler = (error, queueName) => {
  debug(`An error has occurred on queue ${queueName}:`, error)
}

/**
 * A task scheduler that holds multiple named queues. The tasks in each queue are handled
 * one after the other. However, tasks in general (across queues) are handled concurrently.
 */
export class TaskScheduler<TTask> {
  worker: TaskWorker<TTask>
  workerQueue: PQueue
  queues: { [key: string]: TTask[] } = {}
  errorHandler: QueueErrorHandler

  /**
   * Creates a TaskScheduler that handles tasks using the specified worker.
   */
  constructor (opts: {
    worker: TaskWorker<TTask>,
    concurrency?: number,
    errorHandler?: QueueErrorHandler
  }) {
    this.worker = opts.worker
    this.workerQueue = new PQueue({
      concurrency: opts.concurrency || 1,
      autoStart: true
    })
    this.errorHandler = opts.errorHandler || defaultErrorHandler
  }

  onIdle () {
    return this.workerQueue.onIdle()
  }

  stop () {
    this.queues = {}
  }

  /**
   * Queue a task onto the queue with queueName
   */
  queue (queueName: string, task: TTask) {
    const queue = this.queues[queueName]
    if (queue) {
      queue.push(task)
    } else {
      this.queues[queueName] = [task]
      this.queueWorkForQueueName(queueName)
    }
  }

  hasQueued (queueName: string) {
    const queue = this.queues[queueName]
    return queue && queue.length > 0
  }

  getQueue (queueName: string): TTask[] {
    return this.queues[queueName] || []
  }

  private async doWorkForKey (queueName: string) {
    debug(`doWorkForKey(${queueName})`)
    const queue = this.queues[queueName]
    if (!queue || queue.length === 0) {
      debug(`Queue is empty`)
      delete this.queues[queueName]
      return
    }

    // We just checked whether the queue was empty.
    // It should never return `undefined`.
    // Checking for `undefined` will cause incorrect
    // behaviour when the task itself is actually
    // the value `undefined`.
    const task = queue.shift() as TTask

    try {
      debug(`Running worker`)
      await this.worker(task)
    } finally {
      if (queue.length > 0) {
        debug(`Queue is not empty, queueing work`)
        this.queueWorkForQueueName(queueName)
      } else {
        debug(`Queue is empty, deleting queue`)
        delete this.queues[queueName]
      }
    }
  }

  private queueWorkForQueueName (queueName: string) {
    this.workerQueue.add(this.doWorkForKey.bind(this, queueName))
      .then(() => {
        // Task succeeded.
        debug(`${queueName}: task succeeded`)
      }, (error) => {
        this.errorHandler(error, queueName)
      })
  }
}
