export { PullRequestState, MergeableState, CommentAuthorAssociation, PullRequestReviewState, CheckStatusState, CheckConclusionState } from './query.graphql'
import { ElementOf } from './type-utils'
import { validateQuery, validatePullRequest } from './query-validator'

export interface RepositoryReference {
  owner: string
  repo: string
}

export interface PullRequestReference extends RepositoryReference {
  number: number
}

export type QueryResult = ReturnType<typeof validateQuery>
export type RepositoryInfo = QueryResult['repository']
export type PullRequestInfoWithoutRepository = ReturnType<typeof validatePullRequest>
export type PullRequestInfo = PullRequestInfoWithoutRepository & {
  repository: {
    branchProtectionRules: RepositoryInfo['branchProtectionRules']
  }
}
export type Review = ElementOf<PullRequestInfo['reviews']['nodes']>
export type Commit = ElementOf<PullRequestInfo['commits']['nodes']>['commit']
export type CheckSuite = ElementOf<Commit['checkSuites']['nodes']>
export type CheckRun = ElementOf<CheckSuite['checkRuns']['nodes']>
export type Ref = PullRequestInfo['headRef']
