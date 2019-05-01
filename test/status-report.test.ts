import { CheckSuite } from './../src/github-models'
import { createPullRequestInfo, createPullRequestContext, createGithubApi, createCheckRun, createConfig, createCheckSuite, createCommit } from './mock'
import { updateStatusReportCheck } from '../src/status-report'

const myappid = 1

function createOtherAppCheckSuite (options?: Partial<CheckSuite>) {
  return createCheckSuite({
    app: {
      databaseId: 123
    },
    checkRuns: {
      nodes: [createCheckRun()]
    },
    ...options
  })
}

function createMyCheckSuite (options?: Partial<CheckSuite>) {
  return createCheckSuite({
    app: {
      databaseId: myappid
    },
    checkRuns: {
      nodes: [createCheckRun()]
    },
    ...options
  })
}

function mock (options: {
  reportStatus: boolean,
  checkSuites: CheckSuite[]
}) {
  const updateCheck = jest.fn()
  const createCheck = jest.fn()

  const config = createConfig({
    reportStatus: options.reportStatus
  })

  const github = createGithubApi({
    checks: {
      update: updateCheck,
      create: createCheck
    }
  })

  const context = createPullRequestContext({
    config,
    github
  })

  const pullRequestInfo = createPullRequestInfo({
    commits: {
      nodes: [createCommit({
        checkSuites: {
          nodes: options.checkSuites
        }
      })]
    }
  })

  return {
    updateCheck,
    createCheck,
    config,
    github,
    context,
    pullRequestInfo
  }
}

describe('updateStatusReportCheck', () => {
  beforeAll(() => {
    jest.mock('../src/myappid', () => myappid)
  })

  afterAll(() => {
    jest.unmock('../src/myappid')
  })

  it('when reportStatus is enabled and a check of this app is in pull request, update existing check', async () => {
    const {
      context,
      pullRequestInfo,
      updateCheck
    } = mock({
      reportStatus: true,
      checkSuites: [
        createMyCheckSuite()
      ]
    })

    await updateStatusReportCheck(context, pullRequestInfo, 'mytitle', 'mysummary', 'mytext')

    expect(updateCheck).toBeCalled()
  })

  it('when reportStatus is enabled and a check of this app is not in pull request, create new check', async () => {
    const {
      context,
      pullRequestInfo,
      createCheck
    } = mock({
      reportStatus: true,
      checkSuites: [
        createOtherAppCheckSuite()
      ]
    })

    await updateStatusReportCheck(context, pullRequestInfo, 'mytitle', 'mysummary', 'mytext')

    expect(createCheck).toBeCalled()
  })

  it('when reportStatus is disabled and a check of this app is not in the pull request, no check should be updated or created', async () => {
    const {
      context,
      pullRequestInfo,
      createCheck,
      updateCheck
    } = mock({
      reportStatus: false,
      checkSuites: [
        createOtherAppCheckSuite()
      ]
    })

    await updateStatusReportCheck(context, pullRequestInfo, 'mytitle', 'mysummary', 'mytext')

    expect(createCheck).not.toBeCalled()
    expect(updateCheck).not.toBeCalled()
  })

  it('when reportStatus is disabled and a check of this app is in the pull request, no check should be updated or created', async () => {
    const {
      context,
      pullRequestInfo,
      createCheck,
      updateCheck
    } = mock({
      reportStatus: false,
      checkSuites: [
        createMyCheckSuite()
      ]
    })

    await updateStatusReportCheck(context, pullRequestInfo, 'mytitle', 'mysummary', 'mytext')

    expect(createCheck).not.toBeCalled()
    expect(updateCheck).toBeCalled()
  })
})
