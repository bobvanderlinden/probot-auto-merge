import { ElementOf } from './utils'
export type PullRequestState = 'OPEN' | 'CLOSED' | 'MERGED'
export type MergeableState = 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN'
export type CommentAuthorAssociation = 'MEMBER' | 'OWNER' | 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIME_CONTRIBUTOR' | 'FIRST_TIMER' | 'NONE'
export type PullRequestReviewState = 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED'

export interface RepositoryReference {
  owner: string
  repo: string
}

export interface PullRequestReference extends RepositoryReference {
  number: number
}

export interface CheckRun {
  id: number,
  name: string
  head_sha: string
  external_id: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required',
  app: {
    id: number,
    owner: {
      login: string
    }
    name: string
  },
  pull_requests: Array<{
    id: number,
    number: number,
    head: {
      ref: string,
      sha: string
    },
    base: {
      ref: string,
      sha: string
    }
  }>
}

export interface Ref {
  repository: {
    owner: {
      login: string
    },
    name: string
  },
  target: {
    oid: string
  }
  name: string
}

export interface PullRequestQueryResult {
  repository: {
    pullRequest: {
      number: number,
      state: PullRequestState,
      mergeable: MergeableState,
      potentialMergeCommit: {
        oid: string
      },
      reviews: {
        nodes: Array<{
          authorAssociation: CommentAuthorAssociation,
          author: {
            login: string
          }
          submittedAt: string,
          state: PullRequestReviewState
        }>
      },
      labels: {
        nodes: Array<{
          name: string
        }>
      },
      title: string,
      authorAssociation: CommentAuthorAssociation,
      baseRef: Ref,
      baseRefOid: string,
      headRef: Ref,
      headRefOid: string,
      repository: {
        branchProtectionRules: {
          nodes: Array<{
            pattern: string,
            restrictsPushes: boolean,
            requiresStrictStatusChecks: boolean
            requiredStatusCheckContexts: string[]
          }>
        }
      }
    }
  }
}

export type PullRequestInfo = PullRequestQueryResult['repository']['pullRequest'] & {
  checkRuns: CheckRun[]
}

export type Review = ElementOf<PullRequestInfo['reviews']['nodes']>
