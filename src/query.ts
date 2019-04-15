import { captureException } from 'raven'
import { RepositoryReference, QueryResult } from './github-models'
import { RepositoryQueryVariables, RepositoryQuery } from './query.graphql'
import { Context } from 'probot'
import { GitHubAPI, GraphQLQueryError } from 'probot/lib/github'
import { readFileSync } from 'fs'
import { join } from 'path'
import { validateQuery } from './query-validator';
const queryGraphqlString = readFileSync(join(__dirname, '..', 'query.graphql'), 'utf8')

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
  'pullRequests',
  'nodes',
  isNumber,
  'commits',
  'nodes',
  isNumber,
  'commit',
  'checkSuites',
  'nodes',
  isNumber,
  'app'
]

async function graphQLQuery (github: GitHubAPI, variables: RepositoryQueryVariables): Promise<RepositoryQuery> {
  try {
    return await github.query(queryGraphqlString, variables, {
      'Accept': 'application/vnd.github.antiope-preview+json, application/vnd.github.merge-info-preview+json'
    })
  } catch (e) {
    if (e && e.name === 'GraphQLQueryError') {
      const queryError = e as GraphQLQueryError

      // Remove error related to permissions for fetching app id of checkSuites.
      // These errors cannot be  avoided, as auto-merge wants to fetch which checkSuites are its own.
      // Attempting to fetch other checkSuites, where auto-merge doesn't have permissions for, is an side-effect.
      const actualErrors = queryError.errors.filter(error => !(error.path && matchPath(appPath, error.path)))
      if (actualErrors.length > 0) {
        captureException(queryError)
      }

      return queryError.data as RepositoryQuery
    } else {
      throw e
    }
  }
}

export async function query (github: Context['github'], { owner, repo }: RepositoryReference): Promise<QueryResult> {
  const response = await graphQLQuery(github, {
    'owner': owner,
    'repo': repo
  })

  return validateQuery(response)
}
