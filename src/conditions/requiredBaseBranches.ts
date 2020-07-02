import { ConditionConfig } from '../config'
import { ConditionResult } from '../condition'
import { PullRequestInfo } from '../models'

export default function requiredBaseBranches (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestBaseBranch = pullRequestInfo.baseRef.name
  const foundRequiredBaseBranches = config.requiredBaseBranches
    .map(requiredBaseBranch => new RegExp(requiredBaseBranch))
    .filter(requiredBaseBranch => requiredBaseBranch.test(pullRequestBaseBranch))

  if (config.requiredBaseBranches.length === 0 || foundRequiredBaseBranches.length > 0) {
    return {
      status: 'success'
    }
  }
  return {
    status: 'fail',
    message: `Base branch ${pullRequestBaseBranch} does not match list of allowed branches: ${
      config.requiredBaseBranches.join(', ')
    }`
  }
}
