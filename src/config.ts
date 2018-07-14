import { Context } from 'probot'
import getConfig from 'probot-config'

export type Config = {
  'min-approvals': number,
  'max-requested-changes': number,
  'update-branch': boolean,
  'merge-method': 'merge' | 'rebase' | 'squash'
}

const defaultConfig: Config = {
  'min-approvals': 1,
  'max-requested-changes': 0,
  'update-branch': true,
  'merge-method': 'merge'
}

export async function loadConfig(context: Context): Promise<Config> {
  const config = await getConfig(context, 'auto-merge.yml', defaultConfig)
  return config || defaultConfig
}
