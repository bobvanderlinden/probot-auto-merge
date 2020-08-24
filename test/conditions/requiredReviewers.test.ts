import hasRequiredReviewers from '../../src/conditions/requiredReviewers'
import { createConditionConfig, createPullRequestInfo, approvedReview, changesRequestedReview } from '../mock'

describe('requiredReviewers', () => {
  it('returns success when configuration is empty', async () => {
    const result = hasRequiredReviewers(
      createConditionConfig(),
      createPullRequestInfo({
        reviews: {
          nodes: []
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success when configured user approved the pull request', async () => {
    const result = hasRequiredReviewers(
      createConditionConfig({
        requiredReviewers: ['rogerluan']
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'rogerluan' } })
          ]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail when configured user did not approve the pull request', async () => {
    const result = hasRequiredReviewers(
      createConditionConfig({
        requiredReviewers: ['rogerluan']
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'someone_else' } })
          ]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success when configured users approved the pull request', async () => {
    const result = hasRequiredReviewers(
      createConditionConfig({
        requiredReviewers: [
          'rogerluan',
          'bobvanderlinden'
        ]
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: 'rogerluan' } }),
            approvedReview({ author: { login: 'bobvanderlinden' } })
          ]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail when configured users requested changes in the pull request', async () => {
    const result = hasRequiredReviewers(
      createConditionConfig({
        requiredReviewers: [
          'rogerluan'
        ]
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            changesRequestedReview({ author: { login: 'rogerluan' } })
          ]
        }
      })
    )
    expect(result.status).toBe('fail')
  })
})
