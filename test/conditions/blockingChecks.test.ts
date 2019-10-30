import blockingChecks from '../../src/conditions/blockingChecks'
import { createConditionConfig, createPullRequestInfo, successCheckRun, failedCheckRun, createCommitsWithCheckSuiteWithCheckRun } from '../mock'
import { CheckStatusState, CheckConclusionState } from '../../src/models'

describe('blockingChecks', () => {
  it('returns success pull request has succeeding check', async () => {
    const result = blockingChecks(
      createConditionConfig(),
      createPullRequestInfo({
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: successCheckRun
        })
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns pending pull request has in_progress check', async () => {
    const result = blockingChecks(
      createConditionConfig(),
      createPullRequestInfo({
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            status: CheckStatusState.IN_PROGRESS
          }
        })
      })
    )
    expect(result.status).toBe('pending')
  })

  it('returns pending pull request has queued check', async () => {
    const result = blockingChecks(
      createConditionConfig(),
      createPullRequestInfo({
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            status: CheckStatusState.QUEUED
          }
        })
      })
    )
    expect(result.status).toBe('pending')
  })

  it('returns fail pull request has failed check', async () => {
    const result = blockingChecks(
      createConditionConfig(),
      createPullRequestInfo({
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: failedCheckRun
        })
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail pull request has timed_out check', async () => {
    const result = blockingChecks(
      createConditionConfig(),
      createPullRequestInfo({
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            ...failedCheckRun,
            conclusion: CheckConclusionState.TIMED_OUT
          }
        })
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail pull request has cancelled check', async () => {
    const result = blockingChecks(
      createConditionConfig(),
      createPullRequestInfo({
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            ...failedCheckRun,
            conclusion: CheckConclusionState.CANCELLED
          }
        })
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail pull request has action_required check', async () => {
    const result = blockingChecks(
      createConditionConfig(),
      createPullRequestInfo({
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            ...failedCheckRun,
            conclusion: CheckConclusionState.ACTION_REQUIRED
          }
        })
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success pull request has neutral check', async () => {
    const result = blockingChecks(
      createConditionConfig(),
      createPullRequestInfo({
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            ...failedCheckRun,
            conclusion: CheckConclusionState.NEUTRAL
          }
        })
      })
    )
    expect(result.status).toBe('success')
  })
})
