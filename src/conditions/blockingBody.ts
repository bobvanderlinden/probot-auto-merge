import { ConditionConfig } from '../config'
import { ConditionResult } from '../condition'
import { PullRequestInfo } from '../models'

export default function hasBlockingBody (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  if (!config.blockingBodyRegex) {
    return {
      status: 'success'
    }
  }

  const regexObj = new RegExp(config.blockingBodyRegex, 'ig')

  if (regexObj.test(pullRequestInfo.body)) {
    return {
      status: 'fail',
      message: 'Blocking regular expression matched body'
    }
  }
  return {
    status: 'success'
  }
}
