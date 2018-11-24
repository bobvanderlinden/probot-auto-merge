import { ConditionConfig } from './../config'
import { PullRequestInfo  } from '../models'
import { ConditionResult } from '../condition'
import { groupByLastMap, flatMap } from '../utils'
import { CheckStatusState } from '../github-models'
import myAppId from '../myappid'

export default function doesNotHaveBlockingChecks (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const checkRuns = flatMap(pullRequestInfo.commits.nodes,
    commit => flatMap(commit.commit.checkSuites.nodes,
      checkSuite => checkSuite.checkRuns.nodes.map(
        checkRun => ({
          ...checkRun,
          checkSuite
        }))
    )
  ).filter(checkRun => checkRun.checkSuite.app.id !== myAppId)
  const allChecksCompleted = checkRuns.every(
    checkRun => checkRun.status === CheckStatusState.COMPLETED
  )
  if (!allChecksCompleted) {
    return {
      status: 'pending',
      message: 'There are still pending checks'
    }
  }
  const checkConclusions = groupByLastMap(
    checkRun => checkRun.conclusion || 'UNKNOWN',
    _ => true,
    checkRuns
  )
  const checksBlocking =
    checkConclusions.UNKNOWN ||
    checkConclusions.FAILURE ||
    checkConclusions.CANCELLED ||
    checkConclusions.TIMED_OUT ||
    checkConclusions.ACTION_REQUIRED
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
