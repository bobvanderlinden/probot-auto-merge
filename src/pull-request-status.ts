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

export function getFirstSuccessfulResults (ruleConfigs: ConditionConfig[], conditions: Conditions, pullRequestInfo: PullRequestInfo): ConditionResults | undefined {
  for (let ruleConfig of ruleConfigs) {
    const ruleResult = getConditionResults(ruleConfig, conditions, pullRequestInfo)
    if (areSuccessfulResults(ruleResult)) {
      return ruleResult
    }
  }
  return undefined
}

export function getPullRequestStatus (
  context: HandlerContext,
  conditions: Conditions,
  pullRequestInfo: PullRequestInfo
): PullRequestStatus {
  const globalConfig = context.config
  const globalResults = getConditionResults(globalConfig, conditions, pullRequestInfo)

  // If the global configuration returns failing conditions, then this overrules
  // any of the results from rules. There is no need to evaluate rules, so
  // return the global results here.
  if (!areSuccessfulResults(globalResults)) {
    return globalResults
  }

  let fallbackNonSuccessfulResult = undefined
  for (let ruleConfig of globalConfig.rules) {
    const ruleResult = getConditionResults(ruleConfig, conditions, pullRequestInfo)
    if (areSuccessfulResults(ruleResult)) {
      return ruleResult
    }

    // Store the first non-successful result for the return value when
    // no rule has a successful result.
    if (fallbackNonSuccessfulResult === undefined) {
      fallbackNonSuccessfulResult = ruleResult
    }
  }
  return fallbackNonSuccessfulResult || globalResults
}

export function areSuccessfulResults (conditionResults: ConditionResults): boolean {
  return Object.values(conditionResults).every(conditionResult => conditionResult.status === 'success')
}
