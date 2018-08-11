import { queryPullRequest } from '../src/pull-request-query'
import { createGithubApi, createPullRequestInfo } from './mock'

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
})
