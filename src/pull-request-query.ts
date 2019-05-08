import Raven from 'raven'
import { PullRequestReference, PullRequestInfo, validatePullRequestQuery, RepositoryReference } from './github-models'
import { PullRequestQueryVariables, PullRequestQuery, PullRequestsForBranchQuery, PullRequestsForBranchQueryVariables } from './query.graphql'
import { Context } from 'probot'
import { GitHubAPI, GraphQLQueryError } from 'probot/lib/github'
import { readFileSync } from 'fs'
import { join } from 'path'
import { notEmpty } from './utils'

const pullRequestsQuery = readFileSync(join(__dirname, '..', 'pullRequestQuery.graphql'), 'utf8')
const pullRequestsForBranchQuery = readFileSync(join(__dirname, '..', 'pullRequestsForBranchQuery.graphql'), 'utf8')

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

async function graphQLPullRequestQuery (github: GitHubAPI, variables: PullRequestQueryVariables): Promise<PullRequestQuery> {
  try {
    return await github.query(pullRequestsQuery, variables, {
      'Accept': 'application/vnd.github.antiope-preview+json, application/vnd.github.merge-info-preview+json'
    })
  } catch (e) {
    if (e && e.name === 'GraphQLQueryError') {
      const queryError = e as GraphQLQueryError

      // Remove error related to permissions for fetching app id of checkSuites.
      // These errors cannot be  avoided, as auto-merge wants to fetch which checkSuites are its own.
      // Attemping to fetch other checkSuites, where auto-merge doesn't have permissions for, is an side-effect.
      const actualErrors = queryError.errors.filter(error => !(error.path && matchPath(appPath, error.path)))
      if (actualErrors.length > 0) {
        Raven.captureException(queryError)
      }

      return queryError.data as PullRequestQuery
    } else {
      throw e
    }
  }
}

async function graphQLPullRequestsForBranchQuery (github: GitHubAPI, variables: PullRequestsForBranchQueryVariables): Promise<PullRequestsForBranchQuery> {
  try {
    return await github.query(pullRequestsForBranchQuery, variables, {
      'Accept': 'application/vnd.github.antiope-preview+json, application/vnd.github.merge-info-preview+json'
    })
  } catch (e) {
    if (e && e.name === 'GraphQLQueryError') {
      const queryError = e as GraphQLQueryError

      if (queryError.errors.length > 0) {
        Raven.captureException(queryError)
      }

      return queryError.data as PullRequestsForBranchQuery
    } else {
      throw e
    }
  }
}

export async function queryPullRequest (github: Context['github'], { owner, repo, number: pullRequestNumber }: PullRequestReference): Promise<PullRequestInfo> {
  const response = await graphQLPullRequestQuery(github, {
    'owner': owner,
    'repo': repo,
    'pullRequestNumber': pullRequestNumber
  })

  const checkedResponse = Raven.context({
    extra: { response }
  }, () => validatePullRequestQuery(response))

  return checkedResponse.repository.pullRequest
}

export async function queryPullRequestsForBranch (github: Context['github'], { owner, repo }: RepositoryReference, branchName: string): Promise<PullRequestReference[]> {
  const response = await graphQLPullRequestsForBranchQuery(github, {
    'owner': owner,
    'repo': repo,
    'branch': branchName
  })

  const ref = response && response.repository && response.repository.ref

  if (!ref || !ref.associatedPullRequests.nodes) {
    return []
  }

  return ref.associatedPullRequests.nodes.filter(notEmpty).map(node => ({
    repo,
    owner,
    number: node.number,
    headRef: node.headRefOid
  }))
}
