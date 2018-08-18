import { HandlerContext, PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { groupByLastMap } from '../utils'

export default function doesNotHaveBlockingChecks (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const checkRuns = pullRequestInfo.checkRuns
  const allChecksCompleted = checkRuns.every(
    checkRun => checkRun.status === 'completed'
  )
  if (!allChecksCompleted) {
    return {
      status: 'pending',
      message: 'There are still pending checks'
    }
  }
  const checkConclusions = groupByLastMap(
    checkRun => checkRun.conclusion,
    _ => true,
    checkRuns
  )
  const checksBlocking =
    checkConclusions.failure ||
    checkConclusions.cancelled ||
    checkConclusions.timed_out ||
    checkConclusions.action_required
  if (checksBlocking) {
    return {
      status: 'fail',
      message: 'There are blocking checks'
    }
  }
  return {
    status: 'success'
  }
}
