import open from '../../src/conditions/open'
import { createPullRequestInfo, createConditionConfig } from '../mock'
import { PullRequestState } from '../../src/models'

describe('open', () => {
  it('returns success pull request state is open', async () => {
    const result = open(
      createConditionConfig(),
      createPullRequestInfo({
        state: PullRequestState.OPEN
      })
    )
    expect(result.status).toBe('success')
  })

  test.each([
    PullRequestState.CLOSED,
    PullRequestState.MERGED
  ])('returns fail pull request state is not %s', async (state) => {
    const result = open(
      createConditionConfig(),
      createPullRequestInfo({
        state
      })
    )
    expect(result.status).toBe('fail')
  })
})
