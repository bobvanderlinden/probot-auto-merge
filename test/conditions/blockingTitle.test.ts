import blockingTitle from '../../src/conditions/blockingTitle'
import { createPullRequestInfo, createConditionConfig } from '../mock'

describe('blockingTitle', () => {
  it('returns success if with default configuration(undefined)', async () => {
    const result = blockingTitle(
      createConditionConfig(),
      createPullRequestInfo({
        title: '[WIP] help needed'
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success if there is a match in title', async () => {
    const result = blockingTitle(
      createConditionConfig({
        blockingTitleRegex: 'wip'
      }),
      createPullRequestInfo({
        title: 'Add some feature'
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail if there is not a match in title', async () => {
    const result = blockingTitle(
      createConditionConfig({
        blockingTitleRegex: 'wip'
      }),
      createPullRequestInfo({
        title: '[WIP] help needed'
      })
    )
    expect(result.status).toBe('fail')
  })
})
