import { getConfigFromUserConfig, defaultConfig, ConfigValidationError } from '../src/config'
import { CommentAuthorAssociation } from '../src/models'

describe('Config', () => {
  it('will throw upon invalid type for minApprovals', () => {
    expect(() => {
      getConfigFromUserConfig({
        minApprovals: []
      })
    }).toThrow()
  })

  it('will throw upon invalid value for requiredAuthorRole', () => {
    expect(() => {
      getConfigFromUserConfig({
        requiredAuthorRole: 'Something incorrect'
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

  it('will have default value for requiredAuthorRole', () => {
    const config = getConfigFromUserConfig({})
    expect(config.requiredAuthorRole).toBe(CommentAuthorAssociation.NONE)
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
