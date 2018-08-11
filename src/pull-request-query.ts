import { PullRequestReference, CheckRun } from './github-models';
import { MergeableState } from './pull-request-query';
import { Context } from "probot";
import { result } from './utils';

export type PullRequestState = 'OPEN' | 'CLOSED' | 'MERGED'
export type MergeableState = 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN'
export type CommentAuthorAssociation = 'MEMBER' | 'OWNER' | 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIME_CONTRIBUTOR' | 'FIRST_TIMER' | 'NONE'
export type PullRequestReviewState = 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED'
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
      authorAssociation: CommentAuthorAssociation,
      baseRef: {
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
      },
      baseRefOid: string,
      headRef: {
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
      },
      headRefOid: string,
      repository: {
        protectedBranches: {
          nodes: Array<{
            name: string,
            hasRestrictedPushes: boolean,
            hasStrictRequiredStatusChecks: boolean
          }>
        }
      }
    }
  }
}

export type PullRequestInfo = PullRequestQueryResult['repository']['pullRequest'] & {
  checkRuns: CheckRun[]
}

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
