import mergeable from '../../src/conditions/mergeable'
import { createConditionConfig, createPullRequestInfo } from '../mock'
import { MergeableState } from '../../src/models'

describe('mergeable', () => {
  it('returns success pull request state is MERGEABLE', async () => {
    const result = mergeable(
      createConditionConfig(),
      createPullRequestInfo({
        mergeable: MergeableState.MERGEABLE
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail pull request state is CONFLICTING', async () => {
    const result = mergeable(
      createConditionConfig(),
      createPullRequestInfo({
        mergeable: MergeableState.CONFLICTING
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail pull request state is UNKNOWN', async () => {
    const result = mergeable(
      createConditionConfig(),
      createPullRequestInfo({
        mergeable: MergeableState.UNKNOWN
      })
    )
    expect(result.status).toBe('pending')
  })
})
