import { ConditionConfig } from './../config'
import { ConditionResult } from '../condition'
import { PullRequestInfo } from '../models'

export default function doesNotHaveRequiredTitle (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  if (config.requiredTitleRegex === undefined) {
    return {
      status: 'success'
    }
  }

  const regexObj = new RegExp(config.requiredTitleRegex, 'i')

  if (regexObj.test(pullRequestInfo.title)) {
    return {
      status: 'success'
    }
  }
  return {
    status: 'fail',
    message: `Required regular expression did not match title (${pullRequestInfo.title})`
  }
}
