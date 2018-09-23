import { defaultPullRequestInfo, createPullRequestInfo } from './mock'
import { requiresBranchUpdate } from '../src/pull-request-uptodate'

describe('requiresBranchUpdate', () => {
  it('returns true when pull request is based on strict protected branch and base of PR is not equals to baseRef', async () => {
    const result = requiresBranchUpdate(
      createPullRequestInfo({
        baseRef: {
          ...defaultPullRequestInfo.baseRef,
          name: 'master',
          target: {
            oid: '1111111111111111111111111111111111111111'
          }
        },
        baseRefOid: '0000000000000000000000000000000000000000',
        repository: {
          protectedBranches: {
            nodes: [{
              name: 'master',
              hasRestrictedPushes: true,
              hasStrictRequiredStatusChecks: true
            }]
          }
        }
      })
    )
    expect(result).toBe(true)
  })

  it('returns false when pull request is not based on strict protected branch but does have base of PR not equal to baseRef', async () => {
    const result = requiresBranchUpdate(
      createPullRequestInfo({
        baseRef: {
          ...defaultPullRequestInfo.baseRef,
          name: 'master',
          target: {
            oid: '1111111111111111111111111111111111111111'
          }
        },
        baseRefOid: '0000000000000000000000000000000000000000',
        repository: {
          protectedBranches: {
            nodes: [{
              name: 'master',
              hasRestrictedPushes: true,
              hasStrictRequiredStatusChecks: false
            }]
          }
        }
      })
    )
    expect(result).toBe(false)
  })

  it('returns false when pull request is based on strict protected branch and does have base of PR equal to baseRef', async () => {
    const result = requiresBranchUpdate(
      createPullRequestInfo({
        baseRef: {
          ...defaultPullRequestInfo.baseRef,
          name: 'master',
          target: {
            oid: '0000000000000000000000000000000000000000'
          }
        },
        baseRefOid: '0000000000000000000000000000000000000000',
        repository: {
          protectedBranches: {
            nodes: [{
              name: 'master',
              hasRestrictedPushes: true,
              hasStrictRequiredStatusChecks: true
            }]
          }
        }
      })
    )
    expect(result).toBe(false)
  })
})
