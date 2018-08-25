import { Review, CheckRun, PullRequestReviewState } from './../src/github-models'
import { DeepPartial } from './../src/utils'
import { HandlerContext } from './../src/models'
import {
  PullRequestInfo
} from '../src/models'
import { Config, defaultConfig } from '../src/config'
import { GitHubAPI } from 'probot/lib/github'

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

export function createConfig (options?: Partial<Config>): Config {
  return {
    ...defaultConfig,
    minApprovals: {
      MEMBER: 1
    },
    ...options
  }
}

export function createConditionConfig (options?: PartialConfig): ConditionConfig {
  return createConfig(options)
}

export function createHandlerContext (options?: Partial<HandlerContext>): HandlerContext {
  return {
    log: () => undefined,
    github: options && options.github || createGithubApi(),
    config: options && options.config || createConfig(),
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
  name: 'checka',
  status: 'completed',
  conclusion: 'success',
  head_sha: '12345',
  external_id: '1'
}
export const queuedCheckRun: CheckRun = {
  name: 'checka',
  status: 'queued',
  conclusion: 'neutral',
  head_sha: '12345',
  external_id: '1'
}
export const failedCheckRun: CheckRun = {
  name: 'checka',
  status: 'completed',
  conclusion: 'failure',
  head_sha: '12345',
  external_id: '1'
}
export const neutralCheckRun: CheckRun = {
  name: 'checka',
  status: 'completed',
  conclusion: 'neutral',
  head_sha: '12345',
  external_id: '1'
}
