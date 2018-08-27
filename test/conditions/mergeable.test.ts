import mergeable from '../../src/conditions/mergeable'
import { createConditionConfig, createPullRequestInfo } from '../mock'

describe('mergeable', () => {
  it('returns success pull request state is MERGEABLE', async () => {
    const result = mergeable(
      createConditionConfig(),
      createPullRequestInfo({
        mergeable: 'MERGEABLE'
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail pull request state is CONFLICTING', async () => {
    const result = mergeable(
      createConditionConfig(),
      createPullRequestInfo({
        mergeable: 'CONFLICTING'
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail pull request state is UNKNOWN', async () => {
    const result = mergeable(
      createConditionConfig(),
      createPullRequestInfo({
        mergeable: 'UNKNOWN'
      })
    )
    expect(result.status).toBe('pending')
  })
})
