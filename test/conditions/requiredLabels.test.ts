import requiredLabels from '../../src/conditions/requiredLabels'
<<<<<<< HEAD
import { createHandlerContext, createPullRequestInfo, createConfig } from '../mock'
||||||| parent of 9e099bb... fix build by using config instead of context
import { createPullRequestInfo, createConfig } from '../mock'
=======
import { createPullRequestInfo, createConditionConfig } from '../mock'
>>>>>>> 9e099bb... fix build by using config instead of context

describe('open', () => {
  it('returns success with no labels and no configuration', async () => {
    const result = requiredLabels(
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

  it('returns fail with label not in configuration', async () => {
    const result = requiredLabels(
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label']
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        requiredLabels: ['required label']
=======
      createConditionConfig({
        requiredLabels: ['required label']
>>>>>>> 9e099bb... fix build by using config instead of context
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
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label']
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        requiredLabels: ['required label']
=======
      createConditionConfig({
        requiredLabels: ['required label']
>>>>>>> 9e099bb... fix build by using config instead of context
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
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label']
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        requiredLabels: ['required label']
=======
      createConditionConfig({
        requiredLabels: ['required label']
>>>>>>> 9e099bb... fix build by using config instead of context
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
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label', 'required label 2']
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        requiredLabels: ['required label', 'required label 2']
=======
      createConditionConfig({
        requiredLabels: ['required label', 'required label 2']
>>>>>>> 9e099bb... fix build by using config instead of context
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
<<<<<<< HEAD
      createHandlerContext({
        config: createConfig({
          requiredLabels: ['required label', 'required label 2']
        })
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig({
        requiredLabels: ['required label', 'required label 2']
=======
      createConditionConfig({
        requiredLabels: ['required label', 'required label 2']
>>>>>>> 9e099bb... fix build by using config instead of context
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
