import open from '../../src/conditions/open'
<<<<<<< HEAD
import { createHandlerContext, createPullRequestInfo } from '../mock'
||||||| parent of 9e099bb... fix build by using config instead of context
import { createPullRequestInfo, createConfig } from '../mock'
=======
import { createPullRequestInfo, createConditionConfig } from '../mock'
>>>>>>> 9e099bb... fix build by using config instead of context

describe('open', () => {
  it('returns success pull request state is open', async () => {
    const result = open(
<<<<<<< HEAD
      createHandlerContext(),
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig(),
=======
      createConditionConfig(),
>>>>>>> 9e099bb... fix build by using config instead of context
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
<<<<<<< HEAD
      createHandlerContext(),
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig(),
=======
      createConditionConfig(),
>>>>>>> 9e099bb... fix build by using config instead of context
      createPullRequestInfo({
        state
      })
    )
    expect(result.status).toBe('fail')
  })
})
