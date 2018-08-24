import { ConditionResults, Conditions, conditions } from './../src/conditions/index'
import { getPullRequestStatus } from '../src/pull-request-status'
import { mapObject } from '../src/utils'
import { createHandlerContext, createPullRequestInfo, createConfig, approvedReview } from './mock'
import { ConditionResult } from '../src/condition'

const successConditionResults: ConditionResults = mapObject(conditions, (_) => ({ status: 'success' } as ConditionResult))

function createConditionsFromResults (conditionResults: ConditionResults) {
  return mapObject(conditionResults, conditionResult => jest.fn(() => conditionResult))
}

function createConditions (overrideConditions: Partial<Conditions>): Conditions {
  return {
    ...createConditionsFromResults(successConditionResults),
    ...overrideConditions
  }
}

describe('pull request status', () => {
  it('calls all conditions', () => {
    const successConditions = createConditionsFromResults(successConditionResults)
    getPullRequestStatus(
      createHandlerContext(),
      successConditions,
      createPullRequestInfo()
    )
    for (let conditionFn of Object.values(successConditions)) {
      expect(conditionFn).toHaveBeenCalledTimes(1)
    }
  })

  it('returns success when all conditions and no configuration is defined', () => {
    const successConditions = createConditionsFromResults(successConditionResults)
    const results = getPullRequestStatus(
      createHandlerContext(),
      successConditions,
      createPullRequestInfo()
    )
    expect(results).toEqual(successConditionResults)
  })

  it('returns fail when global config fails and a rule passes', () => {
    const results = getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          rules: [{
            minApprovals: {
              NONE: 0
            }
          }],
          minApprovals: {
            OWNER: 1
          }
        })
      }),
      createConditions({
        minimumApprovals: conditions.minimumApprovals
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({
              authorAssociation: 'MEMBER'
            })
          ]
        }
      })
    )

    expect(results.minimumApprovals.status).toEqual('fail')
  })

  it('returns success when global config passes and there are no rules', () => {
    const results = getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          rules: [],
          minApprovals: {
            MEMBER: 1
          }
        })
      }),
      createConditions({
        minimumApprovals: conditions.minimumApprovals
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({
              authorAssociation: 'MEMBER'
            })
          ]
        }
      })
    )
    expect(results.minimumApprovals.status).toEqual('success')
  })

  it('returns success when no global config and one rule and there are no rules', () => {
    const results = getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          rules: [{
            minApprovals: {
              OWNER: 1
            }
          }, {
            minApprovals: {
              MEMBER: 1
            }
          }]
        })
      }),
      createConditions({
        minimumApprovals: conditions.minimumApprovals
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({
              authorAssociation: 'MEMBER'
            })
          ]
        }
      })
    )

    expect(results.minimumApprovals.status).toEqual('success')
  })
})
