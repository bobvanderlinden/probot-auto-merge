import requiredLabels from '../../src/conditions/requiredLabels'
import { createHandlerContext, createPullRequestInfo, createConfig } from '../mock'

describe('open', () => {
  it('returns success with no labels and no configuration', async () => {
    const result = requiredLabels(
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

  it('returns fail with label not in configuration', async () => {
    const result = requiredLabels(
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label']
        })
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
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label']
        })
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
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label']
        })
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
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label', 'required label 2']
        })
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
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label', 'required label 2']
        })
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
})
