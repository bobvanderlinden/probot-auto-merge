import blockingLabels from '../../src/conditions/blockingLabels'
import { createHandlerContext, createPullRequestInfo, createConfig } from '../mock'

describe('blockingLabels', () => {
  it('returns success with no labels and no configuration', async () => {
    const result = blockingLabels(
      createHandlerContext({
        config: createConfig()
      }),
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
      createHandlerContext({
        config: createConfig({
          blockingLabels: ['blocking label']
        })
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
      createHandlerContext({
        config: createConfig({
          blockingLabels: ['blocking label']
        })
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
      createHandlerContext({
        config: createConfig({
          blockingLabels: ['blocking label']
        })
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
