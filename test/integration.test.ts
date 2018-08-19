import { DeepPartial } from './../src/utils'
import { PullRequestQueryResult } from './../lib/src/github-models.d'
import { GitHubAPI } from 'probot/lib/github'
import { Application } from 'probot'
import probotAutoMerge from '../src/index'
import { createPullRequestInfo, approvedReview, successCheckRun } from './mock'

it('full happy path', async () => {
  const app = new Application()

  const config = `
  minApprovals:
    OWNER: 1
  `

  const pullRequestInfo = createPullRequestInfo({
    reviews: {
      nodes: [
        approvedReview({
          authorAssociation: 'OWNER'
        })
      ]
    },
    checkRuns: [
      successCheckRun
    ]
  })
  const pullRequestQueryResult: PullRequestQueryResult = {
    repository: {
      pullRequest: pullRequestInfo
    }
  }

  const github: any = {
    query: jest.fn(() => {
      return pullRequestQueryResult
    }),
    checks: {
      listForRef: jest.fn(() => ({
        status: 200,
        data: {
          checkRuns: pullRequestInfo.checkRuns
        }
      }))
    },
    pullRequests: {
      merge: jest.fn(() => ({ status: 200 }))
    },
    repos: {
      merge: jest.fn(() => ({ status: 200 })),
      getContent: jest.fn(() => ({
        status: 200,
        data: {
          content: new Buffer(config).toString('base64')
        }
      }))
    },
    gitdata: {
      deleteReference: jest.fn(() => ({ status: 200 }))
    }
  } as DeepPartial<GitHubAPI>

  app.auth = () => {
    return Promise.resolve(github) as any
  }

  app.load(probotAutoMerge)

  await app.receive({
    event: 'pull_request',
    payload: {
      action: 'opened',
      repository: {
        owner: {
          login: 'bobvanderlinden'
        },
        name: 'probot-auto-merge'
      },
      pull_request: {
        number: 1
      }
    }
  } as any)

  expect(github.pullRequests.merge).toHaveBeenCalled()
})
