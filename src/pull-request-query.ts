import { PullRequestReference, CheckRun, PullRequestInfo, PullRequestQueryResult } from './github-models'
import { Context } from 'probot'
import { result } from './utils'

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
            protectedBranches(last: 100) {
              nodes {
                name
                hasRestrictedPushes
                hasStrictRequiredStatusChecks
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
  if (!response) {
    throw new Error(`Could not query pull request ${owner}/${repo}#${pullRequestNumber}`)
  }
  if (!response.repository.pullRequest.headRef && !response.repository.mergeable) {
    const error: any = new Error(`No permission to source repository of pull request`)
    error.pullRequest = `${owner}/${repo}#${pullRequestNumber}`
    throw error
  }

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
