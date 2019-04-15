import { RepositoryQuery, RepositoryQuery_repository_pullRequests_nodes } from './query.graphql'
import { Omit } from './type-utils'

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

function removeTypename<T extends { __typename: any }> (obj: T): Omit<T, '__typename'> {
  const result = obj
  delete result['__typename']
  return result
}

export function validateQuery (query: RepositoryQuery) {
  return assertNotNull(query, 'Could not execute query',
    query => ({
      ...query,
      repository: assertNotNull(query.repository, 'No permission to query repository',
        repository => ({
          ...removeTypename(repository),
          configFile: assertNotNull(repository.configFile, 'Not able to fetch configuration file',
            configFile => ({
              ...configFile,
              text: assertNotNull(
                configFile.__typename === 'Blob'
                  ? configFile.text
                  : null,
                'Not able to fetch configuration file contents',
                text => text
              )
            })),
          pullRequests: assertNotNullNodes(repository.pullRequests, 'Pull request was null',
            pullRequest => pullRequest // We will not validate the full pull request here.
          ),
          branchProtectionRules: assertNotNullNodes(repository.branchProtectionRules, 'No branch protection rules', branchProtectionRule => ({
            ...removeTypename(branchProtectionRule)
          }))
        }))
    })
  )
}

export function validatePullRequest (pullRequest: RepositoryQuery_repository_pullRequests_nodes) {
  return ({
    ...removeTypename(pullRequest),
    potentialMergeCommit: pullRequest.potentialMergeCommit
      ? {
        ...removeTypename(pullRequest.potentialMergeCommit),
        oid: pullRequest.potentialMergeCommit.oid as string,
        parents: assertNotNullNodes(pullRequest.potentialMergeCommit.parents, 'No permission to fetch parents of potential merge commit',
          parent => ({
            ...removeTypename(parent),
            oid: parent.oid as string
          })
        )
      }
      : null,
    mergeable: assertNotNull(pullRequest.mergeable, 'No permission to source repository of pull request', mergeable => mergeable),
    labels: assertNotNullNodes(pullRequest.labels, 'No permission to labels of pull request',
      labels => removeTypename(labels)
    ),
    reviews: assertNotNullNodes(pullRequest.reviews, 'No permission to fetch reviews',
      review => ({
        ...removeTypename(review),
        submittedAt: review.submittedAt as string,
        author: assertNotNull(review.author, 'No permission to fetch author of review', author => removeTypename(author))
      })
    ),
    baseRef: assertNotNull(pullRequest.baseRef, 'No permission to fetch baseRef',
      baseRef => ({
        ...removeTypename(baseRef),
        repository: {
          ...removeTypename(baseRef.repository),
          owner: removeTypename(baseRef.repository.owner)
        },
        target: {
          oid: baseRef.target.oid as string
        }
      })
    ),
    baseRefOid: pullRequest.baseRefOid as string,
    headRef: assertNotNull(pullRequest.headRef, 'No permission to fetch headRef',
      headRef => ({
        ...removeTypename(headRef),
        repository: {
          ...removeTypename(headRef.repository),
          owner: removeTypename(headRef.repository.owner)
        },
        target: {
          oid: headRef.target.oid as string
        }
      })
    ),
    headRefOid: pullRequest.headRefOid as string,
    commits: assertNotNullNodes(pullRequest.commits, 'No permission to fetch commits',
      commit => ({
        ...removeTypename(commit),
        commit: {
          ...removeTypename(commit.commit),
          checkSuites: assertNotNullNodes(commit.commit.checkSuites, 'No permission to fetch checkSuites',
            checkSuite => ({
              ...removeTypename(checkSuite),
              app: checkSuite.app && removeTypename(checkSuite.app),
              checkRuns: assertNotNullNodes(checkSuite.checkRuns, 'No permission to fetch checkRuns',
                checkRun => removeTypename(checkRun)
              )
            })
          )
        }
      })
    )
  })
}
