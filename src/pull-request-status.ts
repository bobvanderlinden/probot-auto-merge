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
  const globalConfig = context.config
  const globalResults = getConditionResults(globalConfig, conditions, pullRequestInfo)
  if (!getConclusion(globalResults)) {
    return globalResults
  }
  return (globalConfig.rules || []).reduce<undefined | ConditionResults>((result, ruleConfig) => {
    if (result !== undefined) {
      return result
    }
    const ruleResult = getConditionResults(ruleConfig, conditions, pullRequestInfo)
    if (getConclusion(ruleResult)) {
      return ruleResult
    }
    return undefined
  }, undefined) || globalResults
}

export function getConclusion (conditionResults: ConditionResults): boolean {
  return Object.values(conditionResults).every(conditionResult => conditionResult.status === 'success')
}
