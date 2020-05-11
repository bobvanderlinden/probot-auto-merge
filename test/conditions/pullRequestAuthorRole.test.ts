import hasPullRequestAuthority from '../../src/conditions/pullRequestAuthorRole'
import { createConditionConfig, createPullRequestInfo } from '../mock'
import { CommentAuthorAssociation } from '../../src/models'

describe('pullRequestAuthorRole', () => {
  it('returns success when pull request author is owner and role was configured for owner', async () => {
    const result = hasPullRequestAuthority(
      createConditionConfig({
        pullRequestAuthorRole: 'OWNER'
      }),
      createPullRequestInfo({
        authorAssociation: CommentAuthorAssociation.OWNER
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail when pull request author is member and role was configured for owner', async () => {
    const result = hasPullRequestAuthority(
      createConditionConfig({
        pullRequestAuthorRole: 'OWNER'
      }),
      createPullRequestInfo({
        authorAssociation: CommentAuthorAssociation.MEMBER
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success when pull request author is member and role was not configured for collaborator', async () => {
    const result = hasPullRequestAuthority(
      createConditionConfig({
        pullRequestAuthorRole: 'COLLABORATOR'
      }),
      createPullRequestInfo({
        authorAssociation: CommentAuthorAssociation.MEMBER
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success when pull request author is member and role was not configured', async () => {
    const result = hasPullRequestAuthority(
      createConditionConfig(),
      createPullRequestInfo({
        authorAssociation: CommentAuthorAssociation.MEMBER
      })
    )
    expect(result.status).toBe('success')
  })
})
