import { ConditionConfig } from '../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function hasRequiredBody (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  if (!config.requiredBodyRegex) {
    return {
      status: 'success'
    }
  }

  const regexObj = new RegExp(config.requiredBodyRegex, 'ig')

  if (regexObj.test(pullRequestInfo.body)) {
    return {
      status: 'success'
    }
  }

  return {
    status: 'fail',
    message: `Required words were not found in body (${pullRequestInfo.body})`
  }
}
