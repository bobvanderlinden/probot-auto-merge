import { HandlerContext, PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function isOpen (context: HandlerContext, pullRequestInfo: PullRequestInfo): ConditionResult {
  return pullRequestInfo.state === 'OPEN'
    ? {
      status: 'success'
    }
    : {
      status: 'fail',
      message: `State of pull request is ${pullRequestInfo.state}`
    }
}
