import { ConditionConfig } from '../config'
import { ConditionResult } from '../condition'
import { PullRequestInfo } from '../models'
import { matchesPattern } from '../pattern'

export default function requiredBaseBranches (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestBaseBranch = pullRequestInfo.baseRef.name
  const hasRequiredBaseBranch = config.requiredBaseBranches
    .some(requiredBaseBranchPattern => matchesPattern(requiredBaseBranchPattern, pullRequestBaseBranch))

  if (config.requiredBaseBranches.length === 0 || hasRequiredBaseBranch) {
    return {
      status: 'success'
    }
  }
  return {
    status: 'fail',
    message: `Base branch ${pullRequestBaseBranch} is not a required base branch`
  }
}
