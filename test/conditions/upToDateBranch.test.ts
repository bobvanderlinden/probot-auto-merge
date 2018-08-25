<<<<<<< HEAD
import { defaultPullRequestInfo, createHandlerContext, createPullRequestInfo } from './../mock'
||||||| parent of 9e099bb... fix build by using config instead of context
import { defaultPullRequestInfo, createPullRequestInfo, createConfig } from './../mock'
=======
import { defaultPullRequestInfo, createPullRequestInfo, createConditionConfig } from './../mock'
>>>>>>> 9e099bb... fix build by using config instead of context
import upToDateBranch from '../../src/conditions/upToDateBranch'

describe('upToDateBranch', () => {
  it('returns fail when pull request is based on strict protected branch and base of PR is not equals to baseRef', async () => {
    const status = upToDateBranch(
<<<<<<< HEAD
      createHandlerContext(),
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig(),
=======
      createConditionConfig(),
>>>>>>> 9e099bb... fix build by using config instead of context
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
    expect(status.status).toBe('fail')
  })

  it('returns success when pull request is not based on strict protected branch but does have base of PR not equal to baseRef', async () => {
    const status = upToDateBranch(
<<<<<<< HEAD
      createHandlerContext(),
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig(),
=======
      createConditionConfig(),
>>>>>>> 9e099bb... fix build by using config instead of context
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
    expect(status.status).toBe('success')
  })

  it('returns success when pull request is based on strict protected branch and does have base of PR equal to baseRef', async () => {
    const status = upToDateBranch(
<<<<<<< HEAD
      createHandlerContext(),
||||||| parent of 9e099bb... fix build by using config instead of context
      createConfig(),
=======
      createConditionConfig(),
>>>>>>> 9e099bb... fix build by using config instead of context
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
    expect(status.status).toBe('success')
  })
})
