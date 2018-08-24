import { ConditionConfig } from './config'
import { HandlerContext, PullRequestInfo } from './models'
import { ConditionResult, Condition } from './condition'

import { Conditions, ConditionResults, ConditionName } from './conditions/'
import { mapObject } from './utils'

export type PullRequestStatus = ConditionResults

export function getConditionResults (
  config: ConditionConfig,
  conditions: Conditions,
  pullRequestInfo: PullRequestInfo
): ConditionResults {
  return mapObject<ConditionName, Condition, ConditionResult>(
    conditions,
    (condition: Condition) => condition(config, pullRequestInfo)
  )
}

export function getPullRequestStatus (
  context: HandlerContext,
  conditions: Conditions,
  pullRequestInfo: PullRequestInfo
): PullRequestStatus {
  return getConditionResults(context.config, pullRequestInfo)
}
