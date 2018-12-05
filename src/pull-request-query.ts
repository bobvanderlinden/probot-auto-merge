import { captureException } from 'raven'
import { PullRequestReference, PullRequestInfo, validatePullRequestQuery } from './github-models'
import { PullRequestQueryVariables, PullRequestQuery } from './query.graphql'
import { Context } from 'probot'
import { GitHubAPI } from 'probot/lib/github'
import { readFileSync } from 'fs'
import { join } from 'path'
const query = readFileSync(join(__dirname, '..', 'query.graphql'), 'utf8')

async function graphQLQuery (github: GitHubAPI, variables: PullRequestQueryVariables): Promise<PullRequestQuery> {
  try {
    return await github.query(query, variables, {
      'Accept': 'application/vnd.github.antiope-preview+json'
    })
  } catch (e) {
    if (e && e.name === 'GraphQLQueryError') {
      captureException(e)
      return e.data as PullRequestQuery
    } else {
      throw e
    }
  }
}

export async function queryPullRequest (github: Context['github'], { owner, repo, number: pullRequestNumber }: PullRequestReference): Promise<PullRequestInfo> {
  const response = await graphQLQuery(github, {
    'owner': owner,
    'repo': repo,
    'pullRequestNumber': pullRequestNumber
  })

  const checkedResponse = validatePullRequestQuery(response)

  return checkedResponse.repository.pullRequest
}
