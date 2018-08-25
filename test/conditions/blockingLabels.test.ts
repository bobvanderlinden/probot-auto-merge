import blockingLabels from '../../src/conditions/blockingLabels'
<<<<<<< HEAD
import { createHandlerContext, createPullRequestInfo, createConfig } from '../mock'
||||||| parent of 9e099bb... fix build by using config instead of context
import { createPullRequestInfo, createConfig } from '../mock'
=======
import { createPullRequestInfo, createConditionConfig } from '../mock'
>>>>>>> 9e099bb... fix build by using config instead of context

describe('blockingLabels', () => {
  it('returns success with no labels and no configuration', async () => {
    const result = blockingLabels(
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
        labels: {
          nodes: []
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success with label not in configuration', async () => {
    const result = blockingLabels(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          blockingLabels: ['blocking label']
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        blockingLabels: ['blocking label']
=======
      createConditionConfig({
        blockingLabels: ['blocking label']
>>>>>>> 9e099bb... fix build by using config instead of context
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'non blocking label'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail with label in configuration', async () => {
    const result = blockingLabels(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          blockingLabels: ['blocking label']
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        blockingLabels: ['blocking label']
=======
      createConditionConfig({
        blockingLabels: ['blocking label']
>>>>>>> 9e099bb... fix build by using config instead of context
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'blocking label'
          }]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail with label, among others, in configuration', async () => {
    const result = blockingLabels(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          blockingLabels: ['blocking label']
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        blockingLabels: ['blocking label']
=======
      createConditionConfig({
        blockingLabels: ['blocking label']
>>>>>>> 9e099bb... fix build by using config instead of context
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'blocking label'
          }, {
            name: 'non blocking label'
          }]
        }
      })
    )
    expect(result.status).toBe('fail')
  })
})
