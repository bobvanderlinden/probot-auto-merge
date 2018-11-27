import hasMinimumApprovals from '../../src/conditions/minimumApprovals'
import { createConditionConfig, createPullRequestInfo, approvedReview } from '../mock'
import { CommentAuthorAssociation } from '../../src/models'

describe('minimumApprovals', () => {
  it('returns success when owner approved and owner was configured', async () => {
    const result = hasMinimumApprovals(
      createConditionConfig({
        minApprovals: {
          OWNER: 1
        }
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'henk' }, authorAssociation: CommentAuthorAssociation.OWNER })
          ]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail when member approved but owner was configured', async () => {
    const result = hasMinimumApprovals(
      createConditionConfig({
        minApprovals: {
          OWNER: 1
        }
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'henk' }, authorAssociation: CommentAuthorAssociation.MEMBER })
          ]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success when owner approved and member was configured', async () => {
    const result = hasMinimumApprovals(
      createConditionConfig({
        minApprovals: {
          MEMBER: 1
        }
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'henk' }, authorAssociation: CommentAuthorAssociation.OWNER })
          ]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success when owner approved but nothing was configured', async () => {
    const result = hasMinimumApprovals(
      createConditionConfig(),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'henk' }, authorAssociation: CommentAuthorAssociation.OWNER })
          ]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail when no-one approved but member was configured', async () => {
    const result = hasMinimumApprovals(
      createConditionConfig({
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
