import { CheckRun } from './../github-models'
import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import minimatch from 'minimatch'
import { CheckConclusionState, CheckStatusState } from '../github-models'
import { getOtherCheckRuns } from '../utils'

const positiveCheckRunConclusions: Array<CheckRun['conclusion']> = [
  CheckConclusionState.SUCCESS, CheckConclusionState.NEUTRAL
]

function isPositiveCheckRun (checkRun: CheckRun): boolean {
  return checkRun.status === CheckStatusState.COMPLETED
    && positiveCheckRunConclusions.indexOf(checkRun.conclusion) > -1
}

function isPendingCheckRun (checkRun: CheckRun): boolean {
  return checkRun.status !== CheckStatusState.COMPLETED
}

function flatMap<TIn, TOut> (list: TIn[], fn: (item: TIn) => TOut[]): TOut[] {
  return list.reduce((result: TOut[], item: TIn) => {
    return result.concat(fn(item))
  }, [])
}

export default function areRequiredChecksPositive (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const branchProtectionRules = pullRequestInfo.repository.branchProtectionRules.nodes
  const matchingBranchProtectionRules = branchProtectionRules
    .filter(rule => minimatch(pullRequestInfo.baseRef.name, rule.pattern))

  const requiredStatusCheckContexts = new Set(
    flatMap(matchingBranchProtectionRules, rule =>
      rule.requiredStatusCheckContexts
    )
  )

  const allRequiredChecksExist = Array.from(requiredStatusCheckContexts)
    .every(requiredCheck => getOtherCheckRuns(pullRequestInfo)
      .some(checkRun => checkRun.name === requiredCheck)
    )

  if (!allRequiredChecksExist) {
    return {
      status: 'pending',
      message: 'Required checks are missing'
    }
  }

  const requiredCheckRuns = getOtherCheckRuns(pullRequestInfo)
    .filter(checkRun => requiredStatusCheckContexts.has(checkRun.name))

  const arePendingCheckRuns = requiredCheckRuns.some(isPendingCheckRun)
  const allSucceedingCheckRuns = requiredCheckRuns.length === 0 || requiredCheckRuns.every(isPositiveCheckRun)

  if (arePendingCheckRuns) {
    return {
      status: 'pending',
      message: 'Waiting for required checks'
    }
  } else if (allSucceedingCheckRuns) {
    return { status: 'success' }
  } else {
    return {
      status: 'fail',
      message: `Required checks did not succeed for the protected branch`
    }
  }
}
