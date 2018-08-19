import { getPullRequestStatus } from '../src/pull-request-status'
import { conditions } from '../src/conditions/'
import { mapObject } from '../src/utils'
import { createHandlerContext, createPullRequestInfo } from './mock'

describe('pull request status', () => {
  it('calls all conditions', () => {
    const conditionResults = mapObject(conditions, _ => ({ status: 'success' }))
    for (let conditionName in conditions) {
      (conditions as any)[conditionName] = jest.fn(() => (conditionResults as any)[conditionName])
    }

    const results = getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo()
    )
    for (let conditionFn of Object.values(conditions)) {
      expect(conditionFn).toHaveBeenCalledTimes(1)
    }
    expect(results).toEqual(conditionResults)
  })
})
