import { HandlerContext, PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function isMergeable (context: HandlerContext, pullRequestInfo: PullRequestInfo): ConditionResult {
  switch (pullRequestInfo.mergeable) {
    case 'MERGEABLE':
      return {
        status: 'success'
      }
    case 'CONFLICTING':
      return {
        status: 'fail',
        message: 'Pull request has conflicts'
      }
    case 'UNKNOWN':
      return {
        status: 'pending',
        message: 'Github could not yet determine the mergeable status of the pull request'
      }
    default:
      throw new Error(`Invalid mergeable state for pull request. mergeable=${pullRequestInfo.mergeable}`)
  }
}
