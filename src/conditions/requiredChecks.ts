import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import minimatch from 'minimatch'
import { StatusState } from '../query.graphql'

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

  const requiredStatusCheckContextNames = new Set(
    flatMap(matchingBranchProtectionRules, rule =>
      rule.requiredStatusCheckContexts
    )
  )

  if (requiredStatusCheckContextNames.size === 0) {
    // There are no required status checks, so this condition passes.
    return { status: 'success' }
  }

  const head = pullRequestInfo.commits.nodes[0]

  if (!head) {
    return {
      status: 'fail',
      message: 'Could not fetch any commit, but there are required checks'
    }
  }

  const requiredStatusCheckContexts = Array.from(requiredStatusCheckContextNames)
    .map(requiredStatusCheckContextName =>
      head.commit.status.contexts
        .filter(context => context.context === requiredStatusCheckContextName)[0]
    )
  const allRequiredChecksExist = requiredStatusCheckContexts.every(requiredStatusCheckContext => requiredStatusCheckContext)

  if (!allRequiredChecksExist) {
    return {
      status: 'pending',
      message: 'Required checks are missing'
    }
  }

  const arePendingCheckRuns = requiredStatusCheckContexts.some(statusCheck => statusCheck.state === StatusState.PENDING)
  const allSucceedingCheckRuns = requiredStatusCheckContexts.every(statusCheck => statusCheck.state === StatusState.SUCCESS)

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
