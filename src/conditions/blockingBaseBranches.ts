import { ConditionConfig } from '../config'
import { ConditionResult } from '../condition'
import { PullRequestInfo } from '../models'
import { matchesPattern } from '../pattern'

export default function blockingBaseBranches (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestBaseBranch = pullRequestInfo.baseRef.name
  const isBlocking = config.blockingBaseBranches
    .some(blockingBaseBranchPattern => matchesPattern(blockingBaseBranchPattern, pullRequestBaseBranch))

  if (isBlocking) {
    return {
      status: 'fail',
      message: `Base branch ${pullRequestBaseBranch} is blocked from merging`
    }
  }
  return {
    status: 'success'
  }
}
