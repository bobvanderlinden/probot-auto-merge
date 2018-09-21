import blockingTitle from '../../src/conditions/blockingTitle'
import { createPullRequestInfo, createConditionConfig } from '../mock'

describe('blockingTitle', () => {
  it('returns fail if there is not a match in title(with default configuration);', async () => {
    const result = blockingTitle(
      createConditionConfig(),
      createPullRequestInfo({
        title: '[WIP] help needed'
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success if there is a match in title;', async () => {
    const result = blockingTitle(
      createConditionConfig({
        blockingTitleRegex: 'wip'
      }),
      createPullRequestInfo({
        title: 'mergeable'
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail if there is not a match in title;', async () => {
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
