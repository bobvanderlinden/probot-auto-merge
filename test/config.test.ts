import { getConfigFromUserConfig, defaultConfig } from '../src/config'

describe('Config', () => {
  it('will throw upon invalid type', () => {
    expect(() => {
      getConfigFromUserConfig({
        minApprovals: []
      })
    }).toThrow()
  })
  it('will have default values for rules', () => {
    const config = getConfigFromUserConfig({
      rules: [{
        minApprovals: {
          OWNER: 1
        }
      }]
    })
    expect(config.rules[0].maxRequestedChanges.NONE).toBe(defaultConfig.maxRequestedChanges.NONE)
  })
})
