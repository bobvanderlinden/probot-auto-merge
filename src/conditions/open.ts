import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function isOpen (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  return pullRequestInfo.state === 'OPEN'
    ? {
      status: 'success'
    }
    : {
      status: 'fail',
      message: `State of pull request is ${pullRequestInfo.state}`
    }
}
