import open from '../../src/conditions/open'
import { createPullRequestInfo, createConfig } from '../mock'

describe('open', () => {
  it('returns success pull request state is open', async () => {
    const result = open(
      createConfig(),
      createPullRequestInfo({
        state: 'OPEN'
      })
    )
    expect(result.status).toBe('success')
  })

  test.each([
    'CLOSED',
    'MERGED'
  ])('returns fail pull request state is not %s', async (state) => {
    const result = open(
      createConfig(),
      createPullRequestInfo({
        state
      })
    )
    expect(result.status).toBe('fail')
  })
})
