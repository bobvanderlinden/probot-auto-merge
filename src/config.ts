import { Context } from 'probot'
import getConfig from 'probot-config'

export type Config = {
  minApprovals: number,
  maxRequestedChanges: number,
  updateBranch: boolean,
  deleteBranchAfterMerge: boolean,
  mergeMethod: 'merge' | 'rebase' | 'squash',
  requiredLabels: string[],
  blockingLabels: string[]
}

export const defaultConfig: Config = {
  minApprovals: 1,
  maxRequestedChanges: 0,
  updateBranch: true,
  deleteBranchAfterMerge: true,
  mergeMethod: 'merge',
  blockingLabels: [],
  requiredLabels: []
}

export async function loadConfig(context: Context): Promise<Config | null> {
  const config = await getConfig(context, 'auto-merge.yml', defaultConfig)
  return {
    ...defaultConfig,
    ...config
  }
}
