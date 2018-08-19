import doesNotHaveMaximumChangesRequested from '../../src/conditions/maximumChangesRequested'
import { createHandlerContext, createConfig, createPullRequestInfo, approvedReview, changesRequestedReview } from '../mock'

describe('maximumChangesRequested', () => {
  it('returns success when owner approved and nothing was configured', async () => {
    const result = doesNotHaveMaximumChangesRequested(
      createHandlerContext({
        config: createConfig()
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

  it('returns fail when owner requested changes and none role has 0 maximum requested changes', async () => {
    const result = doesNotHaveMaximumChangesRequested(
      createHandlerContext({
        config: createConfig({
          maxRequestedChanges: {
            NONE: 0
          }
        })
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            changesRequestedReview({ author: { login: 'henk' }, authorAssociation: 'OWNER' })
          ]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail when owner requested changes and owner role has 0 maximum requested changes', async () => {
    const result = doesNotHaveMaximumChangesRequested(
      createHandlerContext({
        config: createConfig({
          maxRequestedChanges: {
            OWNER: 0
          }
        })
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            changesRequestedReview({ author: { login: 'henk' }, authorAssociation: 'OWNER' })
          ]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success when member requested changes but owner role has 0 maximum requested changes', async () => {
    const result = doesNotHaveMaximumChangesRequested(
      createHandlerContext({
        config: createConfig({
          maxRequestedChanges: {
            OWNER: 0
          }
        })
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            changesRequestedReview({ author: { login: 'henk' }, authorAssociation: 'MEMBER' })
          ]
        }
      })
    )
    expect(result.status).toBe('success')
  })
})
