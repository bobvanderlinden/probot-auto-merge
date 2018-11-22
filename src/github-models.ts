import { PullRequestQuery } from '../__generated__/PullRequestQuery'
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

export type PullRequestQueryResult = PullRequestQuery
type Diff<T, U> = T extends U ? never : T
type NonNullable<T> = Diff<T, null | undefined>
export type PullRequestInfo = NonNullable<NonNullable<PullRequestQueryResult['repository']>['pullRequest']>
export type Review = ElementOf<NonNullable<PullRequestInfo['reviews']>['nodes']>
