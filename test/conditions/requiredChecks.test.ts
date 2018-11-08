import requiredChecks from '../../src/conditions/requiredChecks'
import { createConditionConfig, createPullRequestInfo, createCheckRun, createMasterRef } from '../mock'

describe('requiredChecks', () => {
  it('returns success when there are no required check runs', () => {
    const result = requiredChecks(
      createConditionConfig(),
      createPullRequestInfo({
        checkRuns: [
          createCheckRun({
            name: 'mycheckrun',
            status: 'completed',
            conclusion: 'failure'
          })
        ],
        baseRef: createMasterRef(),
        repository: {
          branchProtectionRules: {
            nodes: [{
              pattern: 'master',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: [
              ]
            }]
          }
        }
      })
    )
    expect(result).toEqual({ status: 'success' })
  })
  it('returns success when required checkrun succeeded', () => {
    const result = requiredChecks(
      createConditionConfig(),
      createPullRequestInfo({
        checkRuns: [
          createCheckRun({
            name: 'mycheckrun',
            status: 'completed',
            conclusion: 'success'
          })
        ],
        baseRef: createMasterRef(),
        repository: {
          branchProtectionRules: {
            nodes: [{
              pattern: 'master',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: [
                'mycheckrun'
              ]
            }]
          }
        }
      })
    )
    expect(result).toEqual({ status: 'success' })
  })

  it('returns pending when required checkrun is in progress', () => {
    const result = requiredChecks(
      createConditionConfig(),
      createPullRequestInfo({
        checkRuns: [
          createCheckRun({
            name: 'mycheckrun',
            status: 'in_progress'
          })
        ],
        baseRef: createMasterRef(),
        repository: {
          branchProtectionRules: {
            nodes: [{
              pattern: 'master',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: [
                'mycheckrun'
              ]
            }]
          }
        }
      })
    )
    expect(result.status).toBe('pending')
  })

  it('returns pending when required checkrun does not exist', () => {
    const result = requiredChecks(
      createConditionConfig(),
      createPullRequestInfo({
        checkRuns: [
        ],
        baseRef: createMasterRef(),
        repository: {
          branchProtectionRules: {
            nodes: [{
              pattern: 'master',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: [
                'mycheckrun'
              ]
            }]
          }
        }
      })
    )
    expect(result.status).toBe('pending')
  })

  it('returns fail when required checkrun fails with glob-matching protection rule', () => {
    const result = requiredChecks(
      createConditionConfig(),
      createPullRequestInfo({
        checkRuns: [
          createCheckRun({
            name: 'mycheckrun',
            status: 'completed',
            conclusion: 'failure'
          })
        ],
        baseRef: createMasterRef(),
        repository: {
          branchProtectionRules: {
            nodes: [{
              pattern: 'ma*',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: [
                'mycheckrun'
              ]
            }]
          }
        }
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns success when matching protected branch requires succeeding check run with failing seperate protected branch defined', () => {
    const result = requiredChecks(
      createConditionConfig(),
      createPullRequestInfo({
        checkRuns: [
          createCheckRun({
            name: 'mycheckrun1',
            status: 'completed',
            conclusion: 'success'
          }),
          createCheckRun({
            name: 'mycheckrun2',
            status: 'completed',
            conclusion: 'failure'
          })
        ],
        baseRef: createMasterRef(),
        repository: {
          branchProtectionRules: {
            nodes: [{
              pattern: 'master',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: [
                'mycheckrun1'
              ]
            }, {
              pattern: 'some-other-branch',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: [
                'mycheckrun2'
              ]
            }]
          }
        }
      })
    )
    expect(result.status).toBe('success')
  })
})
