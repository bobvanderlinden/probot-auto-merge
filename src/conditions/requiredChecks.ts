import { CheckRun } from './../github-models'
import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import minimatch from 'minimatch'

const positiveCheckRunConclusions: Array<CheckRun['conclusion']> = [
  'success', 'neutral'
]

function isPositiveCheckRun (checkRun: CheckRun): boolean {
  return checkRun.status === 'completed'
    && positiveCheckRunConclusions.indexOf(checkRun.conclusion) > -1
}

export default function isOpen (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const branchProtectionRules = pullRequestInfo.repository.branchProtectionRules.nodes
  const matchingBranchProtectionRules = branchProtectionRules
    .filter(rule => minimatch(pullRequestInfo.baseRef.name, rule.pattern))

  const result = matchingBranchProtectionRules
    .every(rule =>
      rule.requiredStatusCheckContexts
        .every(requiredCheck => {
          const checkRuns = pullRequestInfo.checkRuns
          const matchingCheckRuns = checkRuns
            .filter(checkRun => checkRun.name === requiredCheck)
          return matchingCheckRuns.length > 0 && matchingCheckRuns.every(isPositiveCheckRun)
        })
    )
  return result
    ? {
      status: 'success'
    }
    : {
      status: 'fail',
      message: `The required checks did not succeed for the protected branch`
    }
}
