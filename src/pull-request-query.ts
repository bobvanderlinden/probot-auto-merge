import { PullRequestReference, PullRequestInfo, validatePullRequestQuery } from './github-models'
import { PullRequestQueryVariables, PullRequestQuery } from '../__generated__/PullRequestQuery'
import { Context } from 'probot'
import { GitHubAPI } from 'probot/lib/github'
import { readFileSync } from 'fs'
import { join } from 'path'
const query = readFileSync(join(__dirname, '..', 'query.graphql'), 'utf8')

async function graphQLQuery (github: GitHubAPI, variables: PullRequestQueryVariables): Promise<PullRequestQuery> {
  return github.query(query, variables, {
    'Accept': 'application/vnd.github.antiope-preview+json, application/vnd.github.merge-info-preview+json'
  })
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
