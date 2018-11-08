import { PullRequestReference, CheckRun, PullRequestInfo, PullRequestQueryResult } from './github-models'
import { Context } from 'probot'
import { result } from './utils'

function assertPullRequest (pullRequest: PullRequestReference, condition: boolean, errorMessage: string) {
  if (!condition) {
    const error: any = new Error(errorMessage)
    error.pullRequest = `${pullRequest.owner}/${pullRequest.repo}#${pullRequest.number}`
    throw error
  }
}

export async function queryPullRequest (github: Context['github'], { owner, repo, number: pullRequestNumber }: PullRequestReference): Promise<PullRequestInfo> {
  const response = await github.query(`
    query PullRequestQuery($owner:String!, $repo:String!, $pullRequestNumber:Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $pullRequestNumber) {
          number
          state
          mergeable
          potentialMergeCommit {
            oid
          }
          reviews(last: 100) {
            nodes {
              authorAssociation
              author {
                login
              }
              submittedAt
              state
            }
          }
          labels(last: 100) {
            nodes {
              name
            }
          }
          title
          authorAssociation
          baseRef {
            repository {
              owner {
                login
              }
              name
            }
            target{
              oid
            }
            name
          }
          baseRefOid
          headRef {
            repository {
              owner {
                login
              }
              name
            }
            target{
              oid
            }
            name
          }
          headRefOid
          repository {
            branchProtectionRules(last: 100) {
              nodes {
                pattern
                restrictsPushes
                requiresStrictStatusChecks
              }
            }
          }
        }
      }
    }
  `, {
    'owner': owner,
    'repo': repo,
    'pullRequestNumber': pullRequestNumber
  }) as any

  const assert = assertPullRequest.bind(null, {
    owner,
    repo,
    number: pullRequestNumber
  })

  assert(response, 'Could not query pull request')
  assert(response.repository, 'Query result does not have repository')
  assert(response.repository.pullRequest.headRef && response.repository.pullRequest.mergeable, 'No permission to source repository of pull request')

  const queryResult = response as PullRequestQueryResult

  const checks = result<{ check_runs: CheckRun[] }>(await github.checks.listForRef({
    owner: queryResult.repository.pullRequest.headRef.repository.owner.login,
    repo: queryResult.repository.pullRequest.headRef.repository.name,
    ref: queryResult.repository.pullRequest.headRef.name,
    filter: 'latest'
  }))

  return {
    checkRuns: checks.check_runs,
    ...queryResult.repository.pullRequest
  }
}
