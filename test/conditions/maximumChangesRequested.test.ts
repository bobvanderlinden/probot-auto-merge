import doesNotHaveMaximumChangesRequested from '../../src/conditions/maximumChangesRequested'
<<<<<<< HEAD
import { createHandlerContext, createConfig, createPullRequestInfo, approvedReview, changesRequestedReview } from '../mock'
||||||| parent of 9e099bb... fix build by using config instead of context
import { createConfig, createPullRequestInfo, approvedReview, changesRequestedReview } from '../mock'
=======
import { createConditionConfig, createPullRequestInfo, approvedReview, changesRequestedReview } from '../mock'
>>>>>>> 9e099bb... fix build by using config instead of context

describe('maximumChangesRequested', () => {
  it('returns success when owner approved and nothing was configured', async () => {
    const result = doesNotHaveMaximumChangesRequested(
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

  it('returns fail when owner requested changes and none role has 0 maximum requested changes', async () => {
    const result = doesNotHaveMaximumChangesRequested(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          maxRequestedChanges: {
            NONE: 0
          }
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        maxRequestedChanges: {
          NONE: 0
        }
=======
      createConditionConfig({
        maxRequestedChanges: {
          NONE: 0
        }
>>>>>>> 9e099bb... fix build by using config instead of context
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
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          maxRequestedChanges: {
            OWNER: 0
          }
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        maxRequestedChanges: {
          OWNER: 0
        }
=======
      createConditionConfig({
        maxRequestedChanges: {
          OWNER: 0
        }
>>>>>>> 9e099bb... fix build by using config instead of context
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
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          maxRequestedChanges: {
            OWNER: 0
          }
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        maxRequestedChanges: {
          OWNER: 0
        }
=======
      createConditionConfig({
        maxRequestedChanges: {
          OWNER: 0
        }
>>>>>>> 9e099bb... fix build by using config instead of context
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
