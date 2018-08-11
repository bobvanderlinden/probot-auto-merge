import { TaskScheduler } from '../src/task-scheduler'

describe('TaskScheduler', () => {
  it('executes a single task', () => {
    const worker = jest.fn()
    const taskScheduler = new TaskScheduler({ worker })
    taskScheduler.queue('myqueue', 0)
    expect(worker).toBeCalledWith(0)
  })
  it('executes two tasks on different queues', async () => {
    const worker = jest.fn()
    const taskScheduler = new TaskScheduler({ worker })
    taskScheduler.queue('a', 0)
    taskScheduler.queue('b', 1)
    await taskScheduler.onIdle()
    expect(worker.mock.calls).toEqual([
      [0],
      [1]
    ])
    expect(worker).toBeCalledWith(0)
    expect(worker).toBeCalledWith(1)
  })
  it('executes two queues in the right order', async () => {
    const worker = jest.fn()
    const taskScheduler = new TaskScheduler({ worker })
    taskScheduler.queue('a', 0)
    taskScheduler.queue('a', 2)
    taskScheduler.queue('b', 1)
    await taskScheduler.onIdle()
    expect(worker.mock.calls).toEqual([
      [0],
      [1],
      [2]
    ])
  })
  it('executes two queues in the right order with time in-between queue calls', async () => {
    const worker = jest.fn()
    const taskScheduler = new TaskScheduler({ worker })
    taskScheduler.queue('a', 0)
    await taskScheduler.onIdle()
    taskScheduler.queue('a', 1)
    taskScheduler.queue('b', 2)
    await taskScheduler.onIdle()
    expect(worker.mock.calls).toEqual([
      [0],
      [1],
      [2]
    ])
  })
  it('stops executing when stop is called', async () => {
    const worker = jest.fn()
    const taskScheduler = new TaskScheduler({ worker })
    taskScheduler.queue('a', 0)
    taskScheduler.queue('a', 0)
    taskScheduler.stop()
    await taskScheduler.onIdle()
    expect(worker.mock.calls).toEqual([
      [0]
    ])
  })
})

