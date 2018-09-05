import { WaitQueue } from './../src/WaitQueue'
import { immediate, delay } from '../src/delay'

jest.useFakeTimers()

function callable (): ((() => void) & { promise: Promise<void>, reset: () => void }) {
  let promiseResolve: () => void
  const result: any = () => {
    promiseResolve()
  }
  result.reset = () => {
    result.promise = new Promise((resolve, reject) => {
      promiseResolve = resolve
    })
  }
  result.reset()
  return result
}

describe('WaitQueue', () => {
  it('runs worker upon queueing work', async () => {
    const drain = callable()
    const worker = jest.fn(() => Promise.resolve())
    const waitQueue = new WaitQueue<string>(
      (work: string) => work,
      worker,
      drain
    )
    expect(worker).not.toBeCalled()
    waitQueue.queueLast('hello')
    expect(worker).toBeCalled()
    expect(worker).toBeCalled()
    await drain.promise
  })
  it('runs worker after delay upon queueing work with delay', async () => {
    const drain = callable()
    const worker = jest.fn(() => Promise.resolve())
    const waitQueue = new WaitQueue<string>(
      (work: string) => work,
      worker,
      drain
    )
    expect(worker).not.toBeCalled()
    waitQueue.queueLast('hello', 1000)
    expect(worker).not.toBeCalled()
    jest.advanceTimersByTime(1000)
    await immediate()
    expect(worker).toBeCalled()
    await drain.promise
  })
  it('cancels delay when queued again', async () => {
    const drain = callable()
    const worker = jest.fn(() => Promise.resolve())
    const waitQueue = new WaitQueue<string>(
      (work: string) => work,
      worker,
      drain
    )
    expect(worker).not.toBeCalled()
    waitQueue.queueLast('hello', 1000)
    expect(worker).not.toBeCalled()
    waitQueue.stopWaitingFor('hello')
    waitQueue.queueLast('hello')
    await immediate()
    expect(worker).toBeCalled()
    await drain.promise
  })
  it('only calls worker of canceled delays once', async () => {
    const drain = callable()
    const worker = jest.fn(() => Promise.resolve())
    const waitQueue = new WaitQueue<string>(
      (work: string) => work,
      worker,
      drain
    )
    waitQueue.queueLast('hello', 1000)
    waitQueue.stopWaitingFor('hello')
    waitQueue.queueLast('hello')
    await drain.promise
    expect(worker).toHaveBeenCalledTimes(1)
  })
  it('deduplicates work', async () => {
    const drain = callable()
    const worker = jest.fn(() => delay(1000))
    const waitQueue = new WaitQueue<string>(
      (work: string) => work,
      worker,
      drain
    )
    waitQueue.queueLast('hello')
    waitQueue.queueLast('hello')
    waitQueue.queueLast('hello')

    // Make sure all timers and promises have ran.
    jest.runAllTimers()
    await immediate()
    jest.runAllTimers()
    await immediate()

    await drain.promise
    expect(worker).toHaveBeenCalledTimes(2)
  })
  it('will execute duplicates when queued after drained', async () => {
    const drain = callable()
    const worker = jest.fn(() => delay(1000))
    const waitQueue = new WaitQueue<string>(
      (work: string) => work,
      worker,
      drain
    )
    waitQueue.queueLast('hello')
    await immediate()
    jest.runAllTimers()
    await drain.promise
    waitQueue.queueLast('hello')
    await immediate()
    jest.runAllTimers()
    await drain.promise
    expect(worker).toHaveBeenCalledTimes(2)
  })
})
