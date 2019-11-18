import requiredBody from '../../src/conditions/requiredBody'
import { createPullRequestInfo, createConditionConfig } from '../mock'

describe('open', () => {
  it('returns success with empty body and no configuration', async () => {
    const result = requiredBody(
      createConditionConfig(),
      createPullRequestInfo({
        body: ''
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail with body not in configuration', async () => {
    const result = requiredBody(
      createConditionConfig({
        requiredBodyRegex: 'required-body'
      }),
      createPullRequestInfo({
        body: 'unrelated'
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success with body in configuration', async () => {
    const result = requiredBody(
      createConditionConfig({
        requiredBodyRegex: 'required-body'
      }),
      createPullRequestInfo({
        body: 'required-body'
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success with longer body with body in configuration', async () => {
    const result = requiredBody(
      createConditionConfig({
        requiredBodyRegex: 'required-body'
      }),
      createPullRequestInfo({
        body: `This is a long multi-line pull request description
        
labels: required-body`
      })
    )
    expect(result.status).toBe('success')
  })
})
