import hasMinimumApprovals from '../../src/conditions/minimumApprovals'
<<<<<<< HEAD
import { createHandlerContext, createConfig, createPullRequestInfo, approvedReview } from '../mock'
||||||| parent of 9e099bb... fix build by using config instead of context
import { createConfig, createPullRequestInfo, approvedReview } from '../mock'
=======
import { createConditionConfig, createPullRequestInfo, approvedReview } from '../mock'
>>>>>>> 9e099bb... fix build by using config instead of context

describe('minimumApprovals', () => {
  it('returns success when owner approved and owner was configured', async () => {
    const result = hasMinimumApprovals(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          minApprovals: {
            OWNER: 1
          }
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        minApprovals: {
          OWNER: 1
        }
=======
      createConditionConfig({
        minApprovals: {
          OWNER: 1
        }
>>>>>>> 9e099bb... fix build by using config instead of context
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'henk' }, authorAssociation: 'OWNER' })
          ]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail when member approved but owner was configured', async () => {
    const result = hasMinimumApprovals(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          minApprovals: {
            OWNER: 1
          }
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        minApprovals: {
          OWNER: 1
        }
=======
      createConditionConfig({
        minApprovals: {
          OWNER: 1
        }
>>>>>>> 9e099bb... fix build by using config instead of context
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'henk' }, authorAssociation: 'MEMBER' })
          ]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success when owner approved and member was configured', async () => {
    const result = hasMinimumApprovals(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          minApprovals: {
            MEMBER: 1
          }
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        minApprovals: {
          MEMBER: 1
        }
=======
      createConditionConfig({
        minApprovals: {
          MEMBER: 1
        }
>>>>>>> 9e099bb... fix build by using config instead of context
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'henk' }, authorAssociation: 'OWNER' })
          ]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success when owner approved but nothing was configured', async () => {
    const result = hasMinimumApprovals(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig()
      }),
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig(),
=======
      createConditionConfig(),
>>>>>>> 9e099bb... fix build by using config instead of context
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'henk' }, authorAssociation: 'OWNER' })
          ]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail when no-one approved but member was configured', async () => {
    const result = hasMinimumApprovals(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          minApprovals: {
            MEMBER: 1
          }
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        minApprovals: {
          MEMBER: 1
        }
=======
      createConditionConfig({
        minApprovals: {
          MEMBER: 1
        }
>>>>>>> 9e099bb... fix build by using config instead of context
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
          ]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

})
