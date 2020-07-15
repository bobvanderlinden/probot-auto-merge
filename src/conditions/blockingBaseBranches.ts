import { ConditionConfig } from '../config'
import { ConditionResult } from '../condition'
import { PullRequestInfo } from '../models'

export default function blockingBaseBranches (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestBaseBranch = pullRequestInfo.baseRef.name
  const foundBlockingBranches = config.blockingBaseBranches
    .map(blockingBaseBranch => new RegExp(blockingBaseBranch))
    .filter(blockingBaseBranch => blockingBaseBranch.test(pullRequestBaseBranch))

  if (foundBlockingBranches.length > 0) {
    return {
      status: 'fail',
      message: `Base branch ${pullRequestBaseBranch} is blocked from merging`
    }
  }
  return {
    status: 'success'
  }
}
