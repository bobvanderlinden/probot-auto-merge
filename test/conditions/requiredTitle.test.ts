import { createConditionConfig, createPullRequestInfo } from '../mock'

import requiredTitle from '../../src/conditions/requiredTitle'

describe('requiredTitle', () => {
  it('returns success if with default configuration(undefined)', async () => {
    const result = requiredTitle(
      createConditionConfig(),
      createPullRequestInfo({
        title: '[MERGE] Shiny new feature'
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail if there is no match in title', async () => {
    const result = requiredTitle(
      createConditionConfig({
        requiredTitleRegex: 'merge'
      }),
      createPullRequestInfo({
        title: 'Add some feature'
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success if there is a match in title', async () => {
    const result = requiredTitle(
      createConditionConfig({
        requiredTitleRegex: 'merge'
      }),
      createPullRequestInfo({
        title: '[MERGE] Shiny new feature'
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success if there is a regex match in title', async () => {
    const result = requiredTitle(
      createConditionConfig({
        requiredTitleRegex: 'mer.+shiny'
      }),
      createPullRequestInfo({
        title: '[MERGE] Shiny new feature'
      })
    )
    expect(result.status).toBe('success')
  })
})
