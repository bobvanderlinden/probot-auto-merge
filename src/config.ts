import { Context } from 'probot'
import { getConfig } from 'probot-config'

const defaultConfig = {
  'min-approvals': 1,
  'max-requested-changes': 0
}

export type Config = typeof defaultConfig

export async function loadConfig(context: Context): Promise<Config> {
  return await getConfig(context, 'auto-merge.yml', defaultConfig)
} 'merge-method': 'merge'
}

export async function loadConfig(context: Context): Promise<Config> {
  return await getConfig(context, 'auto-merge.yml', defaultConfig)
}
