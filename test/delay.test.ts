jest.useFakeTimers()

it('delay', async () => {
  const { delay, immediate } = require('../src/delay')
  const callback = jest.fn()
  delay(1000).then(callback)
  expect(setTimeout).toBeCalled()
  expect(callback).not.toBeCalled()
  jest.runAllTimers()
  await immediate()
  expect(callback).toBeCalled()
})
