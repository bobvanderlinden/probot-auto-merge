import { PullRequestContext } from './../src/pull-request-handler'
import { ConditionConfig, defaultRuleConfig } from './../src/config'
import { Review, CheckRun, PullRequestReviewState } from './../src/github-models'
import { DeepPartial } from './../src/utils'
import { HandlerContext, PullRequestReference, PullRequestQueryResult } from './../src/models'
import { PullRequestInfo } from '../src/models'
import { Config, defaultConfig } from '../src/config'
import { Application, ApplicationFunction } from 'probot'
import { GitHubAPI } from 'probot/lib/github'
import { LoggerWithTarget } from 'probot/lib/wrap-logger'

export const defaultPullRequestInfo: PullRequestInfo = {
  number: 1,
  state: 'OPEN',
  mergeable: 'MERGEABLE',
  potentialMergeCommit: {
    oid: 'da39a3ee5e6b4b0d3255bfef95601890afd80709'
  },
  baseRef: {
    name: 'master',
    repository: {
      name: 'probot-auto-merge',
      owner: {
        login: 'bobvanderlinden'
      }
    },
    target: {
      oid: 'c00dbbc9dadfbe1e232e93a729dd4752fade0abf'
    }
  },
  baseRefOid: 'c00dbbc9dadfbe1e232e93a729dd4752fade0abf',
  headRef: {
    name: 'pr-some-change',
    repository: {
      name: 'probot-auto-merge',
      owner: {
        login: 'bobvanderlinden'
      }
    },
    target: {
      oid: 'c2a6b03f190dfb2b4aa91f8af8d477a9bc3401dc'
    }
  },
  headRefOid: 'c2a6b03f190dfb2b4aa91f8af8d477a9bc3401dc',
  authorAssociation: 'OWNER',
  labels: {
    nodes: []
  },
  reviews: {
    nodes: []
  },
  repository: {
    protectedBranches: {
      nodes: []
    }
  },
  checkRuns: []
}

export function createPullRequestInfo (pullRequestInfo?: Partial<PullRequestInfo>): PullRequestInfo {
  return {
    ...defaultPullRequestInfo,
    ...pullRequestInfo
  }
}

export function createGithubApi (options?: DeepPartial<GitHubAPI>): GitHubAPI {
  return {
    ...options
  } as GitHubAPI
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialConfig = {
  rules?: Partial<ConditionConfig>[]
} & Partial<Omit<Config, 'rules'>>

export function createConfig (options?: PartialConfig): Config {
  const rules = ((options || {}).rules || []).map(rule => ({
    ...defaultRuleConfig,
    ...rule
  }))
  return {
    ...defaultConfig,
    minApprovals: {
      MEMBER: 1
    },
    ...options,
    rules
  }
}

export function createConditionConfig (options?: PartialConfig): ConditionConfig {
  return createConfig(options)
}

export function createHandlerContext (options?: Partial<HandlerContext>): HandlerContext {
  return {
    log: createEmptyLogger(),
    github: options && options.github || createGithubApi(),
    config: options && options.config || createConfig(),
    ...options
  }
}

export function createPullRequestContext (options?: Partial<PullRequestContext>): PullRequestContext {
  return {
    ...createHandlerContext(options),
    reschedulePullRequest: () => undefined,
    ...options
  }
}

export function review (options: Partial<Review> & { state: PullRequestReviewState }): Review {
  return {
    submittedAt: '2018-07-15T20:53:17Z',
    authorAssociation: 'MEMBER',
    author: {
      login: 'henk'
    },
    ...options
  }
}

export const approvedReview = (options?: Partial<Review>) =>
  review({
    state: 'APPROVED',
    ...options
  })
export const changesRequestedReview = (options?: Partial<Review>) =>
  review({
    state: 'CHANGES_REQUESTED',
    ...options
  })

export const successCheckRun: CheckRun = {
  id: 123,
  name: 'checka',
  status: 'completed',
  conclusion: 'success',
  head_sha: '12345',
  external_id: '1',
  app: {
    id: 123,
    name: 'OtherApp',
    owner: { login: 'OwnerAppOwner' }
  },
  pull_requests: []
}
export const queuedCheckRun: CheckRun = {
  id: 123,
  name: 'checka',
  status: 'queued',
  conclusion: 'neutral',
  head_sha: '12345',
  external_id: '1',
  app: {
    id: 123,
    name: 'OtherApp',
    owner: { login: 'OwnerAppOwner' }
  },
  pull_requests: []
}
export const failedCheckRun: CheckRun = {
  id: 123,
  name: 'checka',
  status: 'completed',
  conclusion: 'failure',
  head_sha: '12345',
  external_id: '1',
  app: {
    id: 123,
    name: 'OtherApp',
    owner: { login: 'OwnerAppOwner' }
  },
  pull_requests: []
}
export const neutralCheckRun: CheckRun = {
  id: 123,
  name: 'checka',
  status: 'completed',
  conclusion: 'neutral',
  head_sha: '12345',
  external_id: '1',
  app: {
    id: 123,
    name: 'OtherApp',
    owner: { login: 'OwnerAppOwner' }
  },
  pull_requests: []
}

type BaseLogger = (...params: any[]) => void
export function createLogger (baseLogger: BaseLogger): LoggerWithTarget {
  const logger: LoggerWithTarget = ((...params: any[]) => baseLogger(...params)) as any
  logger.info = logger
  logger.debug = logger
  logger.error = logger
  logger.warn = logger
  logger.trace = logger
  logger.fatal = logger
  logger.target = logger
  logger.child = (opts) => logger

  const loggerAsAny: any = logger
  loggerAsAny.addStream = () => undefined

  return logger
}

export function createEmptyLogger (): LoggerWithTarget {
  return createLogger(() => undefined)
}

export function createApplication (opts: {
  logger: LoggerWithTarget,
  appFn: ApplicationFunction,
  github: GitHubAPI
}): Application {
  const app = new Application()
  app.catchErrors = false
  app.log = opts.logger
  app.auth = () => {
    return Promise.resolve(opts.github)
  }
  app.load(opts.appFn)
  return app
}

export function createPullRequestOpenedEvent (pullRequest: PullRequestReference): any {
  return {
    name: 'pull_request',
    payload: {
      installation: 1,
      action: 'opened',
      repository: {
        owner: {
          login: pullRequest.owner
        },
        name: pullRequest.repo
      },
      pull_request: {
        number: pullRequest.number
      }
    }
  }
}

export function createCheckRunCreatedEvent (pullRequest: PullRequestReference): any {
  return {
    name: 'check_run',
    payload: {
      installation: 1,
      action: 'created',
      repository: {
        owner: {
          login: pullRequest.owner
        },
        name: pullRequest.repo
      },
      check_run: {
        pull_requests: [{
          number: 1
        }]
      }
    }
  }
}

export function createCheckSuiteCompletedEvent (pullRequest: PullRequestReference): any {
  return {
    name: 'check_suite',
    payload: {
      installation: 1,
      action: 'completed',
      repository: {
        owner: {
          login: pullRequest.owner
        },
        name: pullRequest.repo
      },
      check_suite: {
        pull_requests: [{
          number: 1
        }]
      }
    }
  }
}

export function createOkResponse (): any {
  return jest.fn(() => ({ status: 200 }))
}

export function createGithubApiFromPullRequestInfo (opts: {
  pullRequestInfo: PullRequestInfo,
  config: string
}): GitHubAPI {
  const pullRequestQueryResult: PullRequestQueryResult = {
    repository: {
      pullRequest: opts.pullRequestInfo
    }
  }
  return {
    query: jest.fn(() => {
      return pullRequestQueryResult
    }),
    checks: {
      listForRef: jest.fn(() => ({
        status: 200,
        data: {
          checkRuns: opts.pullRequestInfo.checkRuns
        }
      })),
      create: jest.fn(),
      update: jest.fn()
    },
    pullRequests: {
      merge: createOkResponse()
    },
    repos: {
      merge: createOkResponse(),
      getContent: createGetContent({
        '.github/auto-merge.yml': () => Buffer.from(opts.config)
      })
    },
    gitdata: {
      deleteReference: createOkResponse()
    }
  } as any
}

export function createGetContent (paths: { [key: string]: () => Buffer }): any {
  return ({ user, repo, path }: { user: string, repo: string, path: string }) => {
    const contentFactory = paths[path]
    if (!contentFactory) {
      const error: any = new Error(`No content found at path: ${path}`)
      error.code = 404
      return Promise.reject(error)
    }
    const content = contentFactory().toString('base64')
    return Promise.resolve({
      status: 200,
      data: {
        content
      }
    })
  }
}
