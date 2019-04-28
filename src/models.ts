import { LoggerWithTarget } from 'probot/lib/wrap-logger'
import { Context } from 'probot'
import { Config } from './config'
import { GitHubAPI } from 'probot/lib/github'

export interface WorkerContext {
  createGitHubAPI: () => Promise<GitHubAPI>,
  log: LoggerWithTarget,
  config: Config
}

export interface HandlerContext {
  log: Context['log'],
  github: Context['github']
  config: Config
}

export * from './github-models'
