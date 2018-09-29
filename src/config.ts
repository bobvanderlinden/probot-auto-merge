import { CommentAuthorAssociation } from './github-models'
import { Context } from 'probot'
import getConfig from 'probot-config'
import { Decoder, object, string, optional, number, boolean, array, oneOf, constant } from '@mojotech/json-type-validation'

class ConfigNotFoundError extends Error {
  constructor (
    public readonly filePath: string
  ) {
    super(`Configuration file '${filePath}' not found`)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

class ConfigValidationError extends Error {
  constructor (
    public readonly at: string,
    public readonly message: string
  ) {
    super(`Configuration invalid: ${message} at ${at}`)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export type ConditionConfig = {
  minApprovals: { [key in CommentAuthorAssociation]?: number },
  maxRequestedChanges: { [key in CommentAuthorAssociation]?: number },
  requiredLabels: string[],
  blockingLabels: string[]
}

export type Config = {
  rules: ConditionConfig[],
  updateBranch: boolean,
  deleteBranchAfterMerge: boolean,
  mergeMethod: 'merge' | 'rebase' | 'squash'
  reportStatus: boolean
} & ConditionConfig

export const defaultRuleConfig: ConditionConfig = {
  minApprovals: {
  },
  maxRequestedChanges: {
    NONE: 0
  },
  blockingLabels: [],
  requiredLabels: []
}

export const defaultConfig: Config = {
  rules: [],
  updateBranch: false,
  deleteBranchAfterMerge: false,
  mergeMethod: 'merge',
  reportStatus: false,
  ...defaultRuleConfig
}

const reviewConfigDecover: Decoder<{ [key in CommentAuthorAssociation]: number | undefined }> = object({
  MEMBER: optional(number()),
  OWNER: optional(number()),
  COLLABORATOR: optional(number()),
  CONTRIBUTOR: optional(number()),
  FIRST_TIME_CONTRIBUTOR: optional(number()),
  FIRST_TIMER: optional(number()),
  NONE: optional(number())
})

const conditionConfigDecoder: Decoder<ConditionConfig> = object({
  minApprovals: reviewConfigDecover,
  maxRequestedChanges: reviewConfigDecover,
  requiredLabels: array(string()),
  blockingLabels: array(string())
})

const configDecoder: Decoder<Config> = object({
  rules: array(conditionConfigDecoder),
  minApprovals: reviewConfigDecover,
  maxRequestedChanges: reviewConfigDecover,
  requiredLabels: array(string()),
  blockingLabels: array(string()),
  updateBranch: boolean(),
  deleteBranchAfterMerge: boolean(),
  reportStatus: boolean(),
  mergeMethod: oneOf(
    constant<'merge'>('merge'),
    constant<'rebase'>('rebase'),
    constant<'squash'>('squash')
  )
})

export function validateConfig (config: any) {
  return configDecoder.run(config)
}

export function getConfigFromUserConfig (userConfig: any): Config {
  const config = {
    ...defaultConfig,
    ...userConfig,
    rules: (userConfig.rules || []).map((rule: any) => ({
      ...defaultRuleConfig,
      ...rule
    }))
  }
  const decoded = configDecoder.run(config)
  if (!decoded.ok) {
    throw new ConfigValidationError(decoded.error.message, decoded.error.at)
  }
  return decoded.result
}

export async function loadConfig (context: Context): Promise<Config> {
  const userConfig = await getConfig(context, 'auto-merge.yml', defaultConfig)
  if (!userConfig) {
    throw new ConfigNotFoundError('.github/auto-merge.yml')
  }
  return getConfigFromUserConfig(userConfig)
}
