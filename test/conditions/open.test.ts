import open from '../../src/conditions/open'
import { createHandlerContext, createPullRequestInfo } from '../mock'

describe('open', () => {
  it('returns success pull request state is open', async () => {
    const result = open(
      createHandlerContext(),
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
      createHandlerContext(),
      createPullRequestInfo({
        state
      })
    )
    expect(result.status).toBe('fail')
  })
})
