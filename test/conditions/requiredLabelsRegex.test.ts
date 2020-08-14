import requiredLabelsRegex from '../../src/conditions/requiredLabelsRegex'
import { createPullRequestInfo, createConditionConfig } from '../mock'

describe('requiredLabelsRegex', () => {
  it('returns success with no labels and no configuration', async () => {
    const result = requiredLabelsRegex(
      createConditionConfig(),
      createPullRequestInfo({
        labels: {
          nodes: []
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail with label not in configuration', async () => {
    const result = requiredLabelsRegex(
      createConditionConfig({
        requiredLabelsRegex: ['(.*)approved(.*)']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'label that doesnt match the regex'
          }]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success with label in configuration', async () => {
    const result = requiredLabelsRegex(
      createConditionConfig({
        requiredLabelsRegex: ['(.*)approved(.*)']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'approved by design'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success when there are also other non required labels in pull request', async () => {
    const result = requiredLabelsRegex(
      createConditionConfig({
        requiredLabelsRegex: ['(.*)approved(.*)']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'approved by design'
          }, {
            name: 'non required label'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success when there is more than one required label regex in configuration and all of them match', async () => {
    const result = requiredLabelsRegex(
      createConditionConfig({
        requiredLabelsRegex: ['(.*)urgent(.*)', '(.*)approved(.*)']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'approved by design'
          }, {
            name: 'super urgent'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail when not all required label regex match', async () => {
    const result = requiredLabelsRegex(
      createConditionConfig({
        requiredLabelsRegex: ['(.*)urgent(.*)', '(.*)approved(.*)']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'approved by design'
          }]
        }
      })
    )
    expect(result.status).toBe('fail')
  })
})
