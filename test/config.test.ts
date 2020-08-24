import { getConfigFromUserConfig, defaultConfig, ConfigValidationError } from '../src/config'

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

  it('will parse regex patterns', () => {
    const config = getConfigFromUserConfig({
      requiredLabels: [{ regex: 'regex' }]
    }) as any
    expect(config.requiredLabels[0].regex).toBeInstanceOf(RegExp)
  })

  it('will throw validation error on incorrect configuration', () => {
    const userConfig = {
      blockingLabels: ['labela', { labelb: 'labelc' }]
    }
    const validationError: ConfigValidationError = (() => {
      try {
        getConfigFromUserConfig(userConfig)
      } catch (err) {
        return err
      }
    })()
    expect(validationError).not.toBeUndefined()
    expect(validationError.config.blockingLabels[1]).toEqual(userConfig.blockingLabels[1])
    expect(validationError.decoderError.at).toEqual('input.blockingLabels[1]')
  })
})
