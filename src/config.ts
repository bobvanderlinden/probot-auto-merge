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

export class ConfigValidationError extends Error {
  constructor (
    public readonly decoderError: {
      at: string,
      message: string
    },
    public readonly config: any
  ) {
    super(`Configuration invalid: ${decoderError.message}: ${decoderError.at}`)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export type ConditionConfig = {
  minApprovals: { [key in CommentAuthorAssociation]?: number },
  maxRequestedChanges: { [key in CommentAuthorAssociation]?: number },
  requiredLabels: string[],
  blockingLabels: string[],
  blockingBodyRegex: string | undefined
  requiredBodyRegex: string | undefined
  blockingTitleRegex: string | undefined
  requiredTitleRegex: string | undefined
}

export type Config = {
  rules: ConditionConfig[],
  updateBranch: boolean,
  deleteBranchAfterMerge: boolean,
  mergeMethod: 'merge' | 'rebase' | 'squash'
  mergeCommitMessage?: string
  reportStatus: boolean
} & ConditionConfig

export const defaultRuleConfig: ConditionConfig = {
  minApprovals: {
  },
  maxRequestedChanges: {
    NONE: 0
  },
  blockingLabels: [],
  requiredLabels: [],
  blockingTitleRegex: undefined,
  blockingBodyRegex: undefined,
  requiredTitleRegex: undefined,
  requiredBodyRegex: undefined
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
  blockingLabels: array(string()),
  blockingTitleRegex: optional(string()),
  blockingBodyRegex: optional(string()),
  requiredTitleRegex: optional(string()),
  requiredBodyRegex: optional(string())
})

const configDecoder: Decoder<Config> = object({
  rules: array(conditionConfigDecoder),
  minApprovals: reviewConfigDecover,
  maxRequestedChanges: reviewConfigDecover,
  requiredLabels: array(string()),
  blockingLabels: array(string()),
  blockingTitleRegex: optional(string()),
  blockingBodyRegex: optional(string()),
  requiredTitleRegex: optional(string()),
  requiredBodyRegex: optional(string()),
  updateBranch: boolean(),
  deleteBranchAfterMerge: boolean(),
  reportStatus: boolean(),
  mergeMethod: oneOf(
    constant<'merge'>('merge'),
    constant<'rebase'>('rebase'),
    constant<'squash'>('squash')
  ),
  mergeCommitMessage: optional(string())
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
    throw new ConfigValidationError(decoded.error, config)
  }
  return decoded.result
}

export async function loadConfig (context: Context): Promise<Config> {
  const userConfig = await getConfig(context, 'auto-merge.yml', null)
  if (!userConfig) {
    throw new ConfigNotFoundError('.github/auto-merge.yml')
  }
  return getConfigFromUserConfig(userConfig)
}
