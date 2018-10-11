import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { groupByLastMap } from '../utils'
import myAppId from '../myappid'

export default function doesNotHaveBlockingChecks (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const checkRuns = pullRequestInfo.checkRuns
    .filter(checkRun => checkRun.app.id !== myAppId)
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
