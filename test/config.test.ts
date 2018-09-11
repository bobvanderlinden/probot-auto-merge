import { getConfigFromUserConfig } from '../src/config'

describe('Config', () => {
  it('will throw upon invalid type', () => {
    expect(() => {
      getConfigFromUserConfig({
        minApprovals: []
      })
    }).toThrow()
  })
})
