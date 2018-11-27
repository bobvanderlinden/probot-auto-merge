import requiredChecks from '../../src/conditions/requiredChecks'
import { createConditionConfig, createPullRequestInfo, createCheckRun, createMasterRef, createCommitsWithCheckSuiteWithCheckRun, createCommit, createCheckSuite } from '../mock'
import { CheckConclusionState, CheckStatusState } from '../../src/models';

describe('requiredChecks', () => {
  it('returns success when there are no required check runs', () => {
    const result = requiredChecks(
      createConditionConfig(),
      createPullRequestInfo({
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            name: 'mycheckrun',
            status: CheckStatusState.COMPLETED,
            conclusion: CheckConclusionState.FAILURE
          }
        }),
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
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            name: 'mycheckrun',
            status: CheckStatusState.COMPLETED,
            conclusion: CheckConclusionState.SUCCESS
          }
        }),
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
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            name: 'mycheckrun',
            status: CheckStatusState.IN_PROGRESS
          }
        }),
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
        commits: {
          nodes: [createCommit({
            checkSuites: {
              nodes: []
            }
          })]
        },
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
        commits: createCommitsWithCheckSuiteWithCheckRun({
          checkRun: {
            name: 'mycheckrun',
            status: CheckStatusState.COMPLETED,
            conclusion: CheckConclusionState.FAILURE
          }
        }),
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
        commits: {
          nodes: [createCommit({
            checkSuites: {
              nodes: [createCheckSuite({
                checkRuns: {
                  nodes: [createCheckRun({
                    name: 'mycheckrun1',
                    status: CheckStatusState.COMPLETED,
                    conclusion: CheckConclusionState.SUCCESS
                  }), createCheckRun({
                    name: 'mycheckrun2',
                    status: CheckStatusState.COMPLETED,
                    conclusion: CheckConclusionState.FAILURE
                  })]
                }
              })]
            }
          })]
        },
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
