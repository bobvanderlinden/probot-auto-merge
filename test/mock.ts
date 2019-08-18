import { PullRequestContext } from './../src/pull-request-handler'
import { ConditionConfig, defaultRuleConfig } from './../src/config'
import { Review, CheckRun, PullRequestReviewState, Ref, CheckStatusState, CheckConclusionState, CheckSuite, Commit, RepositoryReference } from './../src/github-models'
import { HandlerContext, PullRequestReference, PullRequestState, MergeableState, CommentAuthorAssociation } from './../src/models'
import { PullRequestInfo } from '../src/models'
import { Config, defaultConfig } from '../src/config'
import { Application, ApplicationFunction } from 'probot'
import { GitHubAPI } from 'probot/lib/github'
import { LoggerWithTarget } from 'probot/lib/wrap-logger'
import { Response, Endpoint } from '@octokit/rest'
import { DeepPartial, Omit } from '../src/type-utils'
import { PullRequestQuery, MergeStateStatus } from '../src/query.graphql'

export const defaultPullRequestInfo = {
  number: 1,
  state: PullRequestState.OPEN,
  mergeable: MergeableState.MERGEABLE,
  mergeStateStatus: MergeStateStatus.CLEAN,
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
  authorAssociation: CommentAuthorAssociation.OWNER,
  labels: {
    nodes: []
  },
  reviews: {
    nodes: []
  },
  commits: {
    nodes: [{
      commit: {
        checkSuites: {
          nodes: []
        }
      }
    }]
  },
  repository: {
    branchProtectionRules: {
      nodes: []
    }
  },
  title: 'Add some feature'
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
    startedAt: new Date('2018-07-15T20:54:39Z'),
    ...options
  }
}

export function review (options: Partial<Review> & { state: PullRequestReviewState }): Review {
  return {
    submittedAt: '2018-07-15T20:53:17Z',
    authorAssociation: CommentAuthorAssociation.MEMBER,
    author: {
      login: 'henk'
    },
    ...options
  }
}

export const approvedReview = (options?: Partial<Review>) =>
  review({
    state: PullRequestReviewState.APPROVED,
    ...options
  })
export const changesRequestedReview = (options?: Partial<Review>) =>
  review({
    state: PullRequestReviewState.CHANGES_REQUESTED,
    ...options
  })

export function createCheckRun (options?: Partial<CheckRun>): CheckRun {
  return {
    databaseId: 123,
    name: 'checka',
    status: CheckStatusState.COMPLETED,
    conclusion: CheckConclusionState.SUCCESS,
    ...options
  }
}

export function createRef (options: Partial<Ref> & Pick<Ref, 'name'>): Ref {
  return {
    repository: {
      name: 'probot-auto-merge',
      owner: {
        login: 'bobvanderlinden'
      }
    },
    target: {
      oid: 'c00dbbc9dadfbe1e232e93a729dd4752fade0abf'
    },
    ...options
  }
}

export function createMasterRef (options?: Partial<Ref>): Ref {
  return createRef({
    name: 'master',
    ...options
  })
}

export const successCheckRun = createCheckRun({
  status: CheckStatusState.COMPLETED,
  conclusion: CheckConclusionState.SUCCESS
})
export const queuedCheckRun = createCheckRun({
  status: CheckStatusState.QUEUED,
  conclusion: CheckConclusionState.NEUTRAL
})
export const failedCheckRun = createCheckRun({
  status: CheckStatusState.COMPLETED,
  conclusion: CheckConclusionState.FAILURE
})
export const neutralCheckRun = createCheckRun({
  status: CheckStatusState.COMPLETED,
  conclusion: CheckConclusionState.NEUTRAL
})

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

export function createStatusEvent (options: RepositoryReference & { sha: string, branchName: string }): any {
  return {
    name: 'status',
    payload: {
      installation: 1,
      sha: options.sha,
      state: 'success',
      description: 'This is a status check',
      branches: [{
        name: options.branchName,
        commit: {
          sha: options.sha
        },
        protected: false
      }],
      repository: {
        owner: {
          login: options.owner
        },
        name: options.repo
      }
    }
  }
}

export function createCommit (options?: Partial<Commit>): { commit: Commit } {
  return {
    commit: {
      checkSuites: {
        nodes: []
      },
      ...options
    }
  }
}

export function createCheckSuite (options?: Partial<CheckSuite>): CheckSuite {
  return {
    app: {
      databaseId: 123
    },
    conclusion: CheckConclusionState.SUCCESS,
    status: CheckStatusState.COMPLETED,
    checkRuns: {
      nodes: []
    },
    ...options
  }
}

export function createCommitsWithCheckSuiteWithCheckRun (options?: {
  commit?: Partial<Omit<Commit, 'checkSuites'>>,
  checkSuite?: Partial<Omit<CheckSuite, 'checkRuns'>>,
  checkRun?: Partial<CheckRun>
}): PullRequestInfo['commits'] {
  options = options || {}
  return {
    nodes: [
      createCommit({
        checkSuites: {
          nodes: [createCheckSuite({
            conclusion: options.checkSuite && options.checkSuite.conclusion || options.checkRun && options.checkRun.conclusion,
            status: options.checkSuite && options.checkSuite.status || options.checkRun && options.checkRun.status,
            checkRuns: {
              nodes: [createCheckRun(options.checkRun)]
            },
            ...options.checkSuite
          })]
        },
        ...options.commit
      })
    ]
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
        }],
        check_suite: {
          app: {
            id: 1
          }
        }
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

export function createResponse<T> (options?: Partial<Response<T>>): Response<T> {
  return {
    data: null,
    status: 200,
    headers: {},
    ...options
  } as any as Response<T>
}

export function createEndpoint<T> (responder: (...args: any[]) => Response<T>): { (...args: any[]): Response<T>, endpoint: Endpoint } {
  return jest.fn(() => responder()) as any
}

export function createResponder<T> (options?: Partial<Response<T>>) {
  return () => createResponse(options)
}

export function createOkEndpoint<T> (options?: Partial<Response<T>>) {
  return createEndpoint(createResponder({
    status: 200,
    ...options
  }))
}

export function createOkResponse<T> (): { (...args: any[]): Response<T>, endpoint: Endpoint } {
  return jest.fn(() => createResponse({ status: 200 })) as any
}

export function createGithubApiFromPullRequestInfo (opts: {
  pullRequestInfo: PullRequestInfo,
  config: string
}): GitHubAPI {
  return createGithubApi(createPartialGithubApiFromPullRequestInfo(opts))
}

export function createPullRequestQuery (pullRequestInfo: PullRequestInfo): PullRequestQuery {
  return {
    repository: {
      __typename: 'Repository',
      pullRequest: pullRequestInfo as any
    }
  }
}

function createPartialGithubApiFromPullRequestInfo (opts: {
  pullRequestInfo: PullRequestInfo,
  config: string
}): DeepPartial<GitHubAPI> {
  const pullRequestQueryResult = createPullRequestQuery(opts.pullRequestInfo)
  return {
    graphql: jest.fn(() => {
      return {
        data: pullRequestQueryResult
      }
    }),
    checks: {
      create: createOkResponse(),
      update: createOkResponse()
    },
    pulls: {
      merge: createOkResponse(),
      list: createOkResponse()
    },
    repos: {
      merge: createOkResponse(),
      getContents: createGetContents({
        '.github/auto-merge.yml': () => Buffer.from(opts.config)
      })
    },
    git: {
      deleteRef: createOkResponse()
    }
  }
}

export function createGetContents (paths: { [key: string]: () => Buffer }): any {
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
