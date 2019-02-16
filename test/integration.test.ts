import {
  createPullRequestInfo,
  approvedReview,
  successCheckRun,
  queuedCheckRun,
  createGithubApi,
  createEmptyLogger,
  createGithubApiFromPullRequestInfo,
  createApplication,
  createPullRequestOpenedEvent,
  createGetContents,
  createCheckSuiteCompletedEvent,
  createCheckRunCreatedEvent,
  createCommitsWithCheckSuiteWithCheckRun,
  createPullRequestQuery
} from './mock'
import { immediate } from '../src/delay'
import appFn from '../src/index'
import { CommentAuthorAssociation } from '../src/models'
import { GraphQLQueryError } from 'probot/lib/github'
it('full happy path', async () => {
  const config = `
  minApprovals:
    OWNER: 1
  `

  const pullRequestInfo = createPullRequestInfo({
    reviews: {
      nodes: [
        approvedReview({
          authorAssociation: CommentAuthorAssociation.OWNER
        })
      ]
    },
    commits: createCommitsWithCheckSuiteWithCheckRun({
      checkRun: successCheckRun
    })
  })

  const github = createGithubApiFromPullRequestInfo({
    pullRequestInfo,
    config
  })

  const app = createApplication({
    appFn,
    logger: createEmptyLogger(),
    github
  })

  await app.receive(
    createPullRequestOpenedEvent({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      number: 1
    })
  )

  expect(github.pullRequests.merge).toHaveBeenCalled()
})

it('not enough approval reviews', async () => {
  const config = `
  minApprovals:
    OWNER: 1
  `

  const pullRequestInfo = createPullRequestInfo({
    reviews: {
      nodes: [
      ]
    },
    commits: createCommitsWithCheckSuiteWithCheckRun({
      checkRun: successCheckRun
    })
  })

  const github = createGithubApiFromPullRequestInfo({
    pullRequestInfo,
    config
  })

  const app = createApplication({
    appFn,
    logger: createEmptyLogger(),
    github
  })

  await app.receive(
    createPullRequestOpenedEvent({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      number: 1
    })
  )

  await app.receive(
    createCheckRunCreatedEvent({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      number: 1
    })
  )

  expect(github.pullRequests.merge).not.toHaveBeenCalled()

  pullRequestInfo.reviews.nodes = [
    approvedReview({
      authorAssociation: CommentAuthorAssociation.OWNER
    })
  ]

  await app.receive(
    createCheckSuiteCompletedEvent({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      number: 1
    })
  )

  expect(github.pullRequests.merge).toHaveBeenCalled()
})

it('no configuration should not schedule any pull request', async () => {
  jest.mock('../src/pull-request-handler', () => {
    return {
      schedulePullRequestTrigger: jest.fn()
    }
  })

  const github = createGithubApi({
    repos: {
      getContents: createGetContents({})
    }
  })

  const app = createApplication({
    appFn,
    logger: createEmptyLogger(),
    github
  })

  expect(
    app.receive(
      createPullRequestOpenedEvent({
        owner: 'bobvanderlinden',
        repo: 'probot-auto-merge',
        number: 1
      })
    )
  ).rejects.toHaveProperty('message', "Configuration file '.github/auto-merge.yml' not found")
})

it('pending check run', async () => {
  jest.useFakeTimers()
  const config = `
  minApprovals:
    OWNER: 1
  `

  const pullRequestInfo = createPullRequestInfo({
    reviews: {
      nodes: [
        approvedReview({
          authorAssociation: CommentAuthorAssociation.OWNER
        })
      ]
    },
    commits: createCommitsWithCheckSuiteWithCheckRun({
      checkRun: queuedCheckRun
    })
  })

  const github = createGithubApiFromPullRequestInfo({
    pullRequestInfo,
    config
  })

  const app = createApplication({
    appFn,
    logger: createEmptyLogger(),
    github
  })

  await app.receive(
    createPullRequestOpenedEvent({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      number: 1
    })
  )

  await immediate()

  expect(github.query).toHaveBeenCalled()
  expect(setTimeout).toHaveBeenCalled()
  expect(github.pullRequests.merge).not.toHaveBeenCalled()
  github.query = jest.fn(async () => {
    return {
      repository: {
        pullRequest: {
          ...pullRequestInfo,
          commits: createCommitsWithCheckSuiteWithCheckRun({
            checkRun: successCheckRun
          })
        }
      }
    }
  })
  jest.runAllTimers()
  await immediate()
  expect(github.query).toHaveBeenCalled()
  expect(github.pullRequests.merge).toHaveBeenCalled()

})

it('to merge when one rule and the global configuration passes', async () => {
  const config = `
    rules:
    - minApprovals:
        OWNER: 1
    - requiredLabels:
      - merge
  `

  const pullRequestInfo = createPullRequestInfo({
    reviews: {
      nodes: [
        approvedReview({
          authorAssociation: CommentAuthorAssociation.CONTRIBUTOR
        })
      ]
    },
    commits: createCommitsWithCheckSuiteWithCheckRun({
      checkRun: successCheckRun
    }),
    labels: {
      nodes: [
        { name: 'merge' }
      ]
    }
  })

  const github = createGithubApiFromPullRequestInfo({
    pullRequestInfo,
    config
  })

  const app = createApplication({
    appFn,
    logger: createEmptyLogger(),
    github
  })

  await app.receive(
    createPullRequestOpenedEvent({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      number: 1
    })
  )

  expect(github.pullRequests.merge).toHaveBeenCalled()
})

it('to report error when processing pull request results in error', async () => {
  const Raven = require('raven')
  const captureException = jest.fn()
  Raven.captureException = captureException
  const consoleError = jest.fn()
  console.error = consoleError

  const github = createGithubApi({
    repos: {
      getContents: createGetContents({
        '.github/auto-merge.yml': () => Buffer.from('')
      })
    },
    query: jest.fn(async () => {
      throw new Error('Something went wrong')
    })
  })

  const app = createApplication({
    appFn,
    logger: createEmptyLogger(),
    github
  })

  await app.receive(
    createPullRequestOpenedEvent({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      number: 1
    })
  )

  expect(captureException).toHaveBeenCalled()
  expect(consoleError).toHaveBeenCalled()
})

it('to report error and continue when graphql query contained errors', async () => {
  const Raven = require('raven')
  const captureException = jest.fn()
  Raven.captureException = captureException
  const consoleError = jest.fn()
  console.error = consoleError

  const config = `
  minApprovals:
    OWNER: 1
  `

  const pullRequestInfo = createPullRequestInfo({
    reviews: {
      nodes: [
        approvedReview({
          authorAssociation: CommentAuthorAssociation.OWNER
        })
      ]
    },
    commits: createCommitsWithCheckSuiteWithCheckRun({
      checkRun: successCheckRun
    })
  })

  const pullRequestQuery = createPullRequestQuery(pullRequestInfo)

  const github = createGithubApi({
    repos: {
      getContents: createGetContents({
        '.github/auto-merge.yml': () => Buffer.from(config)
      })
    },
    pullRequests: {
      merge: jest.fn()
    },
    query: jest.fn(async () => Promise.reject(
      new GraphQLQueryError([{
        message: 'Some problem'
      }], '', {}, pullRequestQuery)
    ))
  })

  const app = createApplication({
    appFn,
    logger: createEmptyLogger(),
    github
  })

  await app.receive(
    createPullRequestOpenedEvent({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      number: 1
    })
  )

  expect(captureException).toHaveBeenCalledTimes(1)
  expect(github.pullRequests.merge).toHaveBeenCalled()
})

it('when no permission to source repository throw a no permission error', async () => {
  const Raven = require('raven')
  const captureException = jest.fn()
  Raven.captureException = captureException

  const config = `
  minApprovals:
    OWNER: 1
  `

  const pullRequestInfo = createPullRequestInfo({
    headRef: undefined,
    mergeable: undefined
  })

  const github = createGithubApiFromPullRequestInfo({
    pullRequestInfo,
    config
  })

  const app = createApplication({
    appFn,
    logger: createEmptyLogger(),
    github
  })

  await app.receive(
    createPullRequestOpenedEvent({
      owner: pullRequestInfo.baseRef.repository.owner.login,
      repo: pullRequestInfo.baseRef.repository.name,
      number: 1
    })
  )

  expect(captureException).toHaveBeenCalled()
  expect(captureException.mock.calls[0][0].message).toContain('No permission')
})
