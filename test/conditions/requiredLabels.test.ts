import requiredLabels from '../../src/conditions/requiredLabels'
import { createPullRequestInfo, createConditionConfig } from '../mock'

describe('open', () => {
  it('returns success with no labels and no configuration', async () => {
    const result = requiredLabels(
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
    const result = requiredLabels(
      createConditionConfig({
        requiredLabels: ['required label']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'non required label'
          }]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success with label in configuration', async () => {
    const result = requiredLabels(
      createConditionConfig({
        requiredLabels: ['required label']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'required label'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success with multiple labels in pull request has required label in configuration', async () => {
    const result = requiredLabels(
      createConditionConfig({
        requiredLabels: ['required label']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'required label'
          }, {
            name: 'non required label'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success with labels in pull request also in configuration', async () => {
    const result = requiredLabels(
      createConditionConfig({
        requiredLabels: ['required label', 'required label 2']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'required label'
          }, {
            name: 'required label 2'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail with labels in pull request also in configuration', async () => {
    const result = requiredLabels(
      createConditionConfig({
        requiredLabels: ['required label', 'required label 2']
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'required label'
          }]
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success with label matching regex in configuration', () => {
    const result = requiredLabels(
      createConditionConfig({
        requiredLabels: [{ regex: /required/ }]
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'required label'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail with label matching regex in configuration', () => {
    const result = requiredLabels(
      createConditionConfig({
        requiredLabels: [{ regex: /non matching/ }]
      }),
      createPullRequestInfo({
        labels: {
          nodes: [{
            name: 'label'
          }]
        }
      })
    )
    expect(result.status).toBe('fail')
  })
})
