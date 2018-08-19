import { HandlerContext, PullRequestInfo } from './models'
import { ConditionResult, Condition } from './condition'

import { conditions, ConditionResults, ConditionName } from './conditions/'
import { mapObject } from './utils'

export type PullRequestStatus = ConditionResults

export function getConditionResults (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): ConditionResults {
  return mapObject<ConditionName, Condition, ConditionResult>(
    conditions,
    (condition: Condition) => condition(context, pullRequestInfo)
  )
}

export function getPullRequestStatus (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): PullRequestStatus {
  return getConditionResults(context, pullRequestInfo)
}
