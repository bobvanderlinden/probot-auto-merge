import { Context } from 'probot'
import getConfig from 'probot-config'

export type Config = {
  'min-approvals': number,
  'max-requested-changes': number,
  'update-branch': boolean,
  'delete-branch-after-merge': boolean,
  'merge-method': 'merge' | 'rebase' | 'squash',
  'required-labels': string[],
  'blocking-labels': string[]
}

export const defaultConfig: Config = {
  'min-approvals': 1,
  'max-requested-changes': 0,
  'update-branch': true,
  'delete-branch-after-merge': true,
  'merge-method': 'merge',
  "blocking-labels": [],
  "required-labels": []
}

export async function loadConfig(context: Context): Promise<Config | null> {
  const config = await getConfig(context, 'auto-merge.yml', defaultConfig)
  return {
    ...defaultConfig,
    ...config
  }
}
