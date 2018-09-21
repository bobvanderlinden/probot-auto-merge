import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function doesNotHaveBlockingTitle (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const regexObj = new RegExp(config.blockingTitleRegex, 'i')

  if (regexObj.test(pullRequestInfo.title)) {
    return {
      status: 'fail',
      message: `Blocking words are found (${ pullRequestInfo.title })`
    }
  }
  return {
    status: 'success'
  }
}
