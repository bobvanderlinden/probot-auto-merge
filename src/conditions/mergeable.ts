import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { MergeableState } from '../github-models'

export default function isMergeable (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  switch (pullRequestInfo.mergeable) {
    case MergeableState.MERGEABLE:
      return {
        status: 'success'
      }
    case MergeableState.CONFLICTING:
      return {
        status: 'fail',
        message: 'Pull request has conflicts'
      }
    case MergeableState.UNKNOWN:
      return {
        status: 'pending',
        message: 'Github could not yet determine the mergeable status of the pull request'
      }
    default:
      throw new Error(`Invalid mergeable state for pull request. mergeable=${pullRequestInfo.mergeable}`)
  }
}
