import { Context } from 'probot'
import { Config } from './config'

export interface HandlerContext {
  log: Context['log'],
  github: Context['github']
  config: Config
}

export * from './github-models'
