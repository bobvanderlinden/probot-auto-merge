import { ConditionResults, Conditions, conditions } from './../src/conditions/index'
import { getPullRequestStatus } from '../src/pull-request-status'
import { mapObject } from '../src/utils'
import { createHandlerContext, createPullRequestInfo } from './mock'
import { ConditionResult } from '../src/condition'

const successConditionResults: ConditionResults = mapObject(conditions, (_) => ({ status: 'success' } as ConditionResult))

function createConditionsFromResults (conditionResults: ConditionResults) {
  return mapObject(conditionResults, conditionResult => jest.fn(() => conditionResult))
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
  })
})
