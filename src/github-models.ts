import { PullRequestQuery, PullRequestQuery_repository_pullRequest_headRef, PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_checkRuns_nodes } from '../__generated__/PullRequestQuery'
import { PullRequestState, MergeableState, CommentAuthorAssociation, PullRequestReviewState } from '../__generated__/globalTypes'
import { ElementOf } from './utils'
export type PullRequestState = PullRequestState
export type MergeableState = MergeableState
export type CommentAuthorAssociation = CommentAuthorAssociation
export type PullRequestReviewState = PullRequestReviewState

export interface RepositoryReference {
  owner: string
  repo: string
}

export interface PullRequestReference extends RepositoryReference {
  number: number
}

export type CheckRun = PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_checkRuns_nodes
export type Ref = PullRequestQuery_repository_pullRequest_headRef

function assertNotNull<TInput, TOutput> (input: TInput | null, errorMessage: string, fn: (input: TInput) => TOutput): TOutput {
  if (input === null) {
    throw new Error(errorMessage)
  }
  return fn(input)
}

export function validatePullRequestQuery (pullRequestQuery: PullRequestQuery) {
  return assertNotNull(pullRequestQuery, 'Could not query pull request',
    response => ({
      ...response,
      repository: assertNotNull(response.repository, 'Query result does not have repository',
        repository => ({
          ...repository,
          pullRequest: assertNotNull(repository.pullRequest, 'No permission to source repository of pull request',
            pullRequest => ({
              ...pullRequest,
              labels: assertNotNull(pullRequest.labels, 'No permission to labels of pull request',
                labels => labels
              ),
              reviews: assertNotNull(pullRequest.reviews, 'No permission to fetch reviews',
                reviews => reviews
              ),
              baseRef: assertNotNull(pullRequest.baseRef, 'No permission to fetch baseRef',
                baseRef => baseRef
              ),
              headRef: assertNotNull(pullRequest.headRef, 'No permission to fetch headRef',
                headRef => headRef
              )
            })
          )
        })
      )
    })
  )
}

type AnyFunction = (...args: any[]) => any;
type ReturnType<T extends AnyFunction> = T extends (...args: any[]) => infer R ? R : any

export type PullRequestQueryResult = ReturnType<typeof validatePullRequestQuery>
type Diff<T, U> = T extends U ? never : T
type NonNullable<T> = Diff<T, null | undefined>
export type PullRequestInfo = NonNullable<NonNullable<PullRequestQueryResult['repository']>['pullRequest']>
export type Review = ElementOf<NonNullable<PullRequestInfo['reviews']>['nodes']>
