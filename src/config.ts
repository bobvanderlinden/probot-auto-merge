import { CommentAuthorAssociation } from './github-models'
import { Context } from 'probot'
import getConfig from 'probot-config'

export type ConditionConfig = {
  minApprovals: { [key in CommentAuthorAssociation]?: number },
  maxRequestedChanges: { [key in CommentAuthorAssociation]?: number },
  requiredLabels: string[],
  blockingLabels: string[]
}

export type Config = {
  updateBranch: boolean,
  deleteBranchAfterMerge: boolean,
  mergeMethod: 'merge' | 'rebase' | 'squash'
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
  ...defaultRuleConfig
}

export async function loadConfig (context: Context): Promise<Config | null> {
  const config = await getConfig(context, 'auto-merge.yml', defaultConfig)
  return config && {
    ...defaultConfig,
    ...config
  }
}
