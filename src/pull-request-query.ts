import Raven from 'raven'
import { PullRequestReference, PullRequestInfo, validatePullRequestQuery } from './github-models'
import { PullRequestQueryVariables, PullRequestQuery } from './query.graphql'
import { Context } from 'probot'
import { GitHubAPI, GraphQlQueryResponse } from 'probot/lib/github'
import { readFileSync } from 'fs'
import { join } from 'path'
const query = readFileSync(join(__dirname, '..', 'query.graphql'), 'utf8')

const isNumber = (v: string | number) => typeof v === 'number'
type Matcher = string | number | ((v: string | number) => boolean)

function matchPath (expected: Matcher[], actual: (string | number)[]): boolean {
  const endOfPath = Symbol('endOfPath')
  const expectedWithEOP = [...expected, endOfPath]
  const actualWithEOP = [...actual, endOfPath]
  return expectedWithEOP.every((expectedMatch, index) => {
    return (typeof expectedMatch === 'function' && expectedMatch(actual[index]))
      || (expectedMatch === actualWithEOP[index])
  })
}

const appPath = [
  'repository',
  'pullRequest',
  'commits',
  'nodes',
  isNumber,
  'commit',
  'checkSuites',
  'nodes',
  isNumber,
  'app'
]

export async function rawGraphQLQuery (github: GitHubAPI, variables: PullRequestQueryVariables): Promise<GraphQlQueryResponse> {
  try {
    // Warning: The type signature of the graphql call is incorrect. It actually returns the data of the graphql response.
    // the errors are passed by throwing an exception.
    const data = await github.graphql(query, {
      ...variables,
      headers: {
        'Accept': 'application/vnd.github.antiope-preview+json, application/vnd.github.merge-info-preview+json'
      }
    }) as any
    return {
      data
    }
  } catch (e) {
    if (e && e.name === 'GraphqlError') {
      const errors = e.errors
      const data = e.data
      return {
        data,
        errors
      }
    } else {
      throw e
    }
  }
}

export async function graphQLQuery (github: GitHubAPI, variables: PullRequestQueryVariables): Promise<PullRequestQuery> {
  const response = await rawGraphQLQuery(github, variables)
  if (response.errors) {
    // Remove error related to permissions for fetching app id of checkSuites.
    // These errors cannot be  avoided, as auto-merge wants to fetch which checkSuites are its own.
    // Attemping to fetch other checkSuites, where auto-merge doesn't have permissions for, is an side-effect.
    const actualErrors = response.errors.filter(error => !(error.path && matchPath(appPath, error.path)))
    if (actualErrors.length > 0) {
      Raven.captureException(new Error('GraphQL error'), {
        extra: {
          response
        }
      })
    }
  }
  return response.data as PullRequestQuery
}

export async function queryPullRequest (github: Context['github'], { owner, repo, number: pullRequestNumber }: PullRequestReference): Promise<PullRequestInfo> {
  const response = await graphQLQuery(github, {
    'owner': owner,
    'repo': repo,
    'pullRequestNumber': pullRequestNumber
  })

  return Raven.context({
    extras: { response }
  }, () => {
    const checkedResponse = validatePullRequestQuery(response)
    return checkedResponse.repository.pullRequest
  })
}
