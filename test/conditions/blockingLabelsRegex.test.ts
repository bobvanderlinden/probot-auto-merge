import blockingLabelsRegex from '../../src/conditions/blockingLabelsRegex'
import { createPullRequestInfo, createConditionConfig } from '../mock'

describe('blockingLabelsRegex', () => {
  it('returns success with no labels and no configuration', async () => {
    const result = blockingLabelsRegex(
      createConditionConfig(),
      createPullRequestInfo({
        labels: {
          nodes: []
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success with label not in configuration', async () => {
    const result = blockingLabelsRegex(
      createConditionConfig({
        blockingLabelsRegex: ['(.*)block(.*)']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'label that doesnt match the regex'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail with label in configuration', async () => {
    const result = blockingLabelsRegex(
      createConditionConfig({
        blockingLabelsRegex: ['(.*)block(.*)']
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
    const result = blockingLabelsRegex(
      createConditionConfig({
        blockingLabelsRegex: ['(.*)block(.*)']
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
