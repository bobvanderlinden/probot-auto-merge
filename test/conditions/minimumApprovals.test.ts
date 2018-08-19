import hasMinimumApprovals from '../../src/conditions/minimumApprovals'
import { createConfig, createPullRequestInfo, approvedReview } from '../mock'

describe('minimumApprovals', () => {
  it('returns success when owner approved and owner was configured', async () => {
    const result = hasMinimumApprovals(
      createConfig({
        minApprovals: {
          OWNER: 1
        }
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
      createConfig({
        minApprovals: {
          OWNER: 1
        }
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
      createConfig({
        minApprovals: {
          MEMBER: 1
        }
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
      createConfig(),
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
      createConfig({
        minApprovals: {
          MEMBER: 1
        }
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
