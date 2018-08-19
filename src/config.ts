import { CommentAuthorAssociation } from './github-models';
import { Context } from 'probot'
import getConfig from 'probot-config'

export type Config = {
  minApprovals: { [key in CommentAuthorAssociation]?: number },
  maxRequestedChanges: { [key in CommentAuthorAssociation]?: number },
  updateBranch: boolean,
  deleteBranchAfterMerge: boolean,
  mergeMethod: 'merge' | 'rebase' | 'squash',
  requiredLabels: string[],
  blockingLabels: string[]
}

export const defaultConfig: Config = {
  minApprovals: {
  },
  maxRequestedChanges: {
    NONE: 0
  },
  updateBranch: false,
  deleteBranchAfterMerge: false,
  mergeMethod: 'merge',
  blockingLabels: [],
  requiredLabels: []
}

export async function loadConfig (context: Context): Promise<Config | null> {
  const config = await getConfig(context, 'auto-merge.yml', defaultConfig)
  return config && {
    ...defaultConfig,
    ...config
  }
}
