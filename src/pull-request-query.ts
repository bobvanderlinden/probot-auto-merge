import { PullRequestReference, CheckRun, PullRequestInfo, PullRequestQueryResult } from './github-models';
import { Context } from "probot";
import { result } from './utils';

export async function queryPullRequest(github: Context['github'], { owner, repo, number }: PullRequestReference): Promise<PullRequestInfo> {
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
    '$owner': owner,
    '$repo': repo,
    '$pullRequestNumber': number
  })
  if (response.status !== 200) {
    throw new Error(`Could not query pull request ${owner}/${repo}#${number}`)
  }
  const queryResult = response.data as PullRequestQueryResult

  const checks = result<{ check_runs: CheckRun[] }>(await github.checks.listForRef({
    owner: queryResult.repository.pullRequest.headRef.repository.owner.login,
    repo: queryResult.repository.pullRequest.headRef.repository.name,
    ref: queryResult.repository.pullRequest.headRef.name,
    filter: "latest"
  }))

  return {
    checkRuns: checks.check_runs,
    ...queryResult.repository.pullRequest
  }
}
