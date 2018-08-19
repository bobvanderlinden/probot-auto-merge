import blockingChecks from '../../src/conditions/blockingChecks'
import { createHandlerContext, createPullRequestInfo, successCheckRun, failedCheckRun } from '../mock'

describe('blockingChecks', () => {
  it('returns success pull request has succeeding check', async () => {
    const result = blockingChecks(
      createHandlerContext(),
      createPullRequestInfo({
        checkRuns: [successCheckRun]
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns pending pull request has in_progress check', async () => {
    const result = blockingChecks(
      createHandlerContext(),
      createPullRequestInfo({
        checkRuns: [{
          ...successCheckRun,
          status: 'in_progress'
        }]
      })
    )
    expect(result.status).toBe('pending')
  })

  it('returns pending pull request has queued check', async () => {
    const result = blockingChecks(
      createHandlerContext(),
      createPullRequestInfo({
        checkRuns: [{
          ...successCheckRun,
          status: 'queued'
        }]
      })
    )
    expect(result.status).toBe('pending')
  })

  it('returns fail pull request has failed check', async () => {
    const result = blockingChecks(
      createHandlerContext(),
      createPullRequestInfo({
        checkRuns: [failedCheckRun]
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail pull request has timed_out check', async () => {
    const result = blockingChecks(
      createHandlerContext(),
      createPullRequestInfo({
        checkRuns: [{
          ...failedCheckRun,
          conclusion: 'timed_out'
        }]
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail pull request has cancelled check', async () => {
    const result = blockingChecks(
      createHandlerContext(),
      createPullRequestInfo({
        checkRuns: [{
          ...failedCheckRun,
          conclusion: 'cancelled'
        }]
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail pull request has action_required check', async () => {
    const result = blockingChecks(
      createHandlerContext(),
      createPullRequestInfo({
        checkRuns: [{
          ...failedCheckRun,
          conclusion: 'action_required'
        }]
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success pull request has neutral check', async () => {
    const result = blockingChecks(
      createHandlerContext(),
      createPullRequestInfo({
        checkRuns: [{
          ...failedCheckRun,
          conclusion: 'neutral'
        }]
      })
    )
    expect(result.status).toBe('success')
  })

})
