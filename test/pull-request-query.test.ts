import { queryPullRequest } from '../src/pull-request-query'
import { createGithubApi, createPullRequestInfo, createPullRequestQuery, createOkEndpoint } from './mock'

describe('queryPullRequest', () => {
  it('should do a single graphql query', async () => {
    const pullRequestInfo = createPullRequestInfo()
    const graphql = jest.fn(() => ({
      data: {
        repository: {
          pullRequest: {
            ...pullRequestInfo
          }
        }
      }
    }))
    const listForRef = createOkEndpoint({
      data: {
        check_runs: []
      }
    })
    await queryPullRequest(
      createGithubApi({
        graphql,
        checks: {
          listForRef
        }
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )
    expect(graphql).toHaveBeenCalledTimes(1)
  })

  it('should throw error when no query response', async () => {
    const graphql = jest.fn(() => ({
      data: null
    }))
    expect(queryPullRequest(
      createGithubApi({
        graphql
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )).rejects.toThrowError('Could not query pull request')
  })

  it('should throw error when empty query response', async () => {
    const graphql = jest.fn(() => ({
      data: {}
    }))
    expect(queryPullRequest(
      createGithubApi({
        graphql
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )).rejects.toThrowError('Query result does not have repository')
  })

  it('should throw error when no headRef and not mergeable', async () => {
    const graphql = jest.fn(() => createPullRequestInfo({
      repository: {
        pullRequest: {
          headRef: undefined,
          mergeable: undefined
        }
      }
    } as any))
    expect(queryPullRequest(
      createGithubApi({
        graphql
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )).rejects.toThrowError('No permission to source repository of pull request')
  })

  it('should captureError on query error', async () => {
    const Raven = require('raven')
    const captureException = jest.fn()
    Raven.captureException = captureException
    const queryResult = createPullRequestQuery(createPullRequestInfo())
    const graphql = jest.fn(() => {
      return {
        errors: [{
          extensions: [],
          locations: [],
          message: '',
          path: ['repository', 'some', 'field']
        }],
        data: queryResult
      }
    })
    await queryPullRequest(
      createGithubApi({
        graphql
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )
    expect(captureException).toBeCalled()
  })

  it('should captureError on query error', async () => {
    const Raven = require('raven')
    const captureException = jest.fn()
    Raven.captureException = captureException
    const queryResult = createPullRequestQuery(createPullRequestInfo())
    const graphql = jest.fn(() => {
      return {
        errors: [{
          extensions: [],
          locations: [],
          message: '',
          path: [
            'repository',
            'pullRequest',
            'commits',
            'nodes',
            0,
            'commit',
            'checkSuites',
            'nodes',
            2,
            'app'
          ]
        }],
        data: queryResult
      }
    })
    await queryPullRequest(
      createGithubApi({
        graphql
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )
    expect(captureException).not.toBeCalled()
  })
})
