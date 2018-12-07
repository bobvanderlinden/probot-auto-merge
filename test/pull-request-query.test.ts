import { queryPullRequest } from '../src/pull-request-query'
import { createGithubApi, createPullRequestInfo, createPullRequestQuery } from './mock'
import { GraphQLQueryError } from 'probot/lib/github';

describe('queryPullRequest', () => {
  it('should do a single graphql query', async () => {
    const pullRequestInfo = createPullRequestInfo()
    const query = jest.fn(() => ({
      repository: {
        pullRequest: {
          ...pullRequestInfo
        }
      }
    }))
    const listForRef = jest.fn(() => ({
      status: 200,
      data: {
        check_runs: []
      }
    }))
    await queryPullRequest(
      createGithubApi({
        query,
        checks: {
          listForRef
        }
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('should throw error when no query response', async () => {
    const query = jest.fn(() => null)
    expect(queryPullRequest(
      createGithubApi({
        query
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )).rejects.toThrowError('Could not query pull request')
  })

  it('should throw error when empty query response', async () => {
    const query = jest.fn(() => ({
    }))
    expect(queryPullRequest(
      createGithubApi({
        query
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )).rejects.toThrowError('Query result does not have repository')
  })

  it('should throw error when no headRef and not mergeable', async () => {
    const query = jest.fn(() => createPullRequestInfo({
      repository: {
        pullRequest: {
          headRef: undefined,
          mergeable: undefined
        }
      }
    } as any))
    expect(queryPullRequest(
      createGithubApi({
        query
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )).rejects.toThrowError('No permission to source repository of pull request')
  })

  it('should captureError on query error', async () => {
    const Raven = require('raven')
    const captureException = jest.fn()
    Raven.captureException = captureException
    const queryResult = createPullRequestQuery(createPullRequestInfo())
    const query = jest.fn(() => {
      throw new GraphQLQueryError([{
        extensions: [],
        locations: [],
        message: '',
        path: ['repository', 'some', 'field']
      }], '', {}, queryResult)
    })
    await queryPullRequest(
      createGithubApi({
        query
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
    const query = jest.fn(() => {
      throw new GraphQLQueryError([{
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
      }], '', {}, queryResult)
    })
    await queryPullRequest(
      createGithubApi({
        query
      }),
      { owner: 'bobvanderlinden', repo: 'probot-auto-merge', number: 1 }
    )
    expect(captureException).not.toBeCalled()
  })
})
