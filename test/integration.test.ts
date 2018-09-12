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
  createGetContent
} from './mock'
import { immediate } from '../src/delay'

it('full happy path', async () => {
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

  const github = createGithubApiFromPullRequestInfo({
    pullRequestInfo,
    config
  })

  const app = createApplication({
    appFn: require('../src/index'),
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

it('no configuration should not schedule any pull request', async () => {
  jest.mock('../src/pull-request-handler', () => {
    return {
      schedulePullRequestTrigger: jest.fn()
    }
  })

  const github = createGithubApi({
    repos: {
      getContent: createGetContent({})
    }
  })

  const app = createApplication({
    appFn: require('../src/index'),
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

it('pending test', async () => {
  jest.useFakeTimers()
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
      queuedCheckRun
    ]
  })

  const github = createGithubApiFromPullRequestInfo({
    pullRequestInfo,
    config
  })

  const app = createApplication({
    appFn: require('../src/index'),
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
  github.query = jest.fn(() => {
    return {
      repository: {
        pullRequest: {
          ...pullRequestInfo,
          checkRuns: [
            successCheckRun
          ]
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
    minApprovals:
      COLLABORATOR: 0
    maxRequestedChanges:
      NONE: 0
    blockingLabels:
    - blocked

    # Will merge whenever the above conditions are met, but also
    # the owner has approved or merge label was added.
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
          authorAssociation: 'CONTRIBUTOR'
        })
      ]
    },
    checkRuns: [
      successCheckRun
    ],
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
    appFn: require('../src/index'),
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
