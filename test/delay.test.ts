jest.useFakeTimers()

describe('delay', () => {
  it('resolves after specified amount of time', async () => {
    const { delay, immediate } = require('../src/delay')
    const callback = jest.fn()
    delay(1000).then(callback)
    await immediate()
    expect(callback).not.toBeCalled()
    jest.advanceTimersByTime(1000)
    await immediate()
    expect(callback).toBeCalled()
  })

  it('when cancelled, resolves immediately', async () => {
    const { delay, immediate } = require('../src/delay')
    const callback = jest.fn()
    const promise = delay(1000)
    promise.then(callback)
    await immediate()
    expect(callback).not.toBeCalled()
    promise.cancel()
    await immediate()
    expect(callback).toBeCalled()
  })
})

describe('immediate', () => {
  it('resolves after tick', async () => {
    const { immediate } = require('../src/delay')
    const callback = jest.fn()
    const promise = immediate().then(callback)
    expect(setImmediate).toBeCalled()
    expect(callback).not.toBeCalled()
    await promise
    expect(callback).toBeCalled()
  })
})
