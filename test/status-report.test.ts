import { CheckRun } from './../src/github-models'
import { createPullRequestInfo, createPullRequestContext, createGithubApi, createCheckRun, createConfig } from './mock'
import { updateStatusReportCheck } from '../src/status-report'

const myappid = 1

function createOtherAppCheckRun (options?: Partial<CheckRun>) {
  return createCheckRun({
    app: {
      id: 123,
      name: 'otherapp',
      owner: {
        login: 'other'
      }
    },
    ...options
  })
}

function createMyCheckRun (options?: Partial<CheckRun>) {
  return createCheckRun({
    app: {
      id: 1,
      name: 'probot-auto-merge',
      owner: {
        login: 'bobvanderlinden'
      }
    },
    ...options
  })
}

function mock (options: {
  reportStatus: boolean,
  checkRuns: CheckRun[]
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
    checkRuns: options.checkRuns
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
      checkRuns: [
        createMyCheckRun()
      ]
    })

    await updateStatusReportCheck(context, pullRequestInfo, 'mytitle', 'mysummary')

    expect(updateCheck).toBeCalled()
  })

  it('when reportStatus is enabled and a check of this app is not in pull request, create new check', async () => {
    const {
      context,
      pullRequestInfo,
      createCheck
    } = mock({
      reportStatus: true,
      checkRuns: [
        createOtherAppCheckRun()
      ]
    })

    await updateStatusReportCheck(context, pullRequestInfo, 'mytitle', 'mysummary')

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
      checkRuns: [
        createOtherAppCheckRun()
      ]
    })

    await updateStatusReportCheck(context, pullRequestInfo, 'mytitle', 'mysummary')

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
      checkRuns: [
        createMyCheckRun()
      ]
    })

    await updateStatusReportCheck(context, pullRequestInfo, 'mytitle', 'mysummary')

    expect(createCheck).not.toBeCalled()
    expect(updateCheck).toBeCalled()
  })
})
