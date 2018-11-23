import { PullRequestReference, CheckRun, PullRequestInfo, PullRequestQueryResult } from './github-models'
import { Context } from 'probot'
import { result } from './utils'
import { PullRequestQueryVariables, PullRequestQuery } from '../__generated__/PullRequestQuery';
import { GitHubAPI } from 'probot/lib/github';
import { readFileSync } from 'fs'
import { join } from 'path'
const query = readFileSync(join(__dirname, 'query.graphql'), 'utf8')

function assertPullRequest (pullRequest: PullRequestReference, condition: boolean, errorMessage: string) {
  if (!condition) {
    const error: any = new Error(errorMessage)
    error.pullRequest = `${pullRequest.owner}/${pullRequest.repo}#${pullRequest.number}`
    throw error
  }
}

function assertNotNull<TInput, TOutput> (input: TInput | null, errorMessage: string, fn: (input: TInput) => TOutput): TOutput {
  if (input === null) {
    throw new Error(errorMessage)
  }
  return fn(input)
}

async function graphQLQuery(github: GitHubAPI, variables: PullRequestQueryVariables): Promise<PullRequestQuery> {
  return await github.query(query, variables, {
    'Accept': 'application/vnd.github.antiope-preview+json, application/vnd.github.merge-info-preview+json'
  }) as any
}

function removeTypenames<T extends Object> (input: T): Exclude<T, { __typename: string }> {
  const result = {}
  for (let (key, value) of input)
  delete result['__typename']
  return result
}

export async function queryPullRequest (github: Context['github'], { owner, repo, number: pullRequestNumber }: PullRequestReference): Promise<PullRequestInfo> {
  const response = await graphQLQuery(github, {
    'owner': owner,
    'repo': repo,
    'pullRequestNumber': pullRequestNumber
  })

  const assert = assertPullRequest.bind(null, {
    owner,
    repo,
    number: pullRequestNumber
  })
  const checkedResponse = assertNotNull(response, 'Could not query pull request',
      response => ({
        repository: assertNotNull(response.repository, 'Query result does not have repository',
          repository => ({
            pullRequest: assertNotNull(repository.pullRequest, 'No permission to source repository of pull request',
              pullRequest => ({
                ...pullRequest,
                labels: assertNotNull(pullRequest.labels, 'No permission to labels of pull request',
                  labels => labels
                )
              })
            )
          })
        )
      })
  )

  return checkedResponse.repository.pullRequest
}
