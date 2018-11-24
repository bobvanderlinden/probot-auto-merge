import { PullRequestQuery, PullRequestQuery_repository_pullRequest_headRef, PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_checkRuns_nodes } from '../__generated__/PullRequestQuery'
export { PullRequestState, MergeableState, CommentAuthorAssociation, PullRequestReviewState, CheckStatusState, CheckConclusionState } from '../__generated__/globalTypes'
import { ElementOf } from './utils'

export interface RepositoryReference {
  owner: string
  repo: string
}

export interface PullRequestReference extends RepositoryReference {
  number: number
}

export type CheckRun = PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_checkRuns_nodes
export type Ref = PullRequestQuery_repository_pullRequest_headRef

function assertNotNull<TInput, TOutput> (input: TInput | null | undefined, errorMessage: string, fn: (input: TInput) => TOutput): TOutput {
  if (input === null || input === undefined) {
    throw new Error(errorMessage)
  }
  return fn(input)
}

function assertNotNullNodes<TNode, TNodeOutput> (input: { nodes: (TNode | null)[] | null } | null, errorMessage: string, fn: (input: TNode) => TNodeOutput): { nodes: TNodeOutput[] } {
  if (input === null) {
    throw new Error(errorMessage)
  }
  if (input.nodes === null) {
    throw new Error(errorMessage)
  }
  return {
    nodes: input.nodes.map(inputNode => {
      if (inputNode === null) {
        throw new Error(errorMessage)
      }
      return fn(inputNode)
    })
  }
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
              mergeable: assertNotNull(pullRequest.mergeable, 'No permission to source repository of pull request', mergeable => mergeable),
              labels: assertNotNullNodes(pullRequest.labels, 'No permission to labels of pull request',
                labels => labels
              ),
              reviews: assertNotNullNodes(pullRequest.reviews, 'No permission to fetch reviews',
                review => ({
                  ...review,
                  author: assertNotNull(review.author, 'No permission to fetch author of review', author => author)
                })
              ),
              baseRef: assertNotNull(pullRequest.baseRef, 'No permission to fetch baseRef',
                baseRef => baseRef
              ),
              headRef: assertNotNull(pullRequest.headRef, 'No permission to fetch headRef',
                headRef => headRef
              ),
              commits: assertNotNullNodes(pullRequest.commits, 'No permission to fetch commits',
                commit => ({
                  ...commit,
                  commit: {
                    ...commit.commit,
                    checkSuites: assertNotNullNodes(commit.commit.checkSuites, 'No permission to fetch checkSuites',
                      checkSuite => ({
                        ...checkSuite,
                        app: assertNotNull(checkSuite.app, 'No permission to fetch app', app => app),
                        checkRuns: assertNotNullNodes(checkSuite.checkRuns, 'No permission to fetch checkRuns',
                          checkRun => checkRun
                        )
                      })
                    )
                  }
                })
              ),
              repository: {
                ...pullRequest.repository,
                branchProtectionRules: assertNotNullNodes(pullRequest.repository.branchProtectionRules, 'No permission to fetch branchProtectionRules',
                  branchProtectionRule => ({
                    ...branchProtectionRule,
                    requiredStatusCheckContexts: assertNotNull(branchProtectionRule.requiredStatusCheckContexts, 'No permission to fetch requiredStatusCheckContexts',
                      requiredStatusCheckContexts => requiredStatusCheckContexts.map(requiredStatusCheckContext => assertNotNull(requiredStatusCheckContext, 'No permission to fetch requiredStatusCheckContext', requiredStatusCheckContext => requiredStatusCheckContext))
                    )
                  })
                )
              }
            })
          )
        })
      )
    })
  )
}

type AnyFunction = (...args: any[]) => any
type ReturnType<T extends AnyFunction> = T extends (...args: any[]) => infer R ? R : any

export type PullRequestQueryResult = ReturnType<typeof validatePullRequestQuery>
type Diff<T, U> = T extends U ? never : T
type NonNullable<T> = Diff<T, null | undefined>
export type PullRequestInfo = NonNullable<NonNullable<PullRequestQueryResult['repository']>['pullRequest']>
export type Review = ElementOf<NonNullable<PullRequestInfo['reviews']>['nodes']>
