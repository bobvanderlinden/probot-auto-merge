import { ConditionConfig } from '../config'
import { ConditionResult } from '../condition'
import { PullRequestInfo } from '../models'

export default function hasRequiredLabelsRegex (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestLabels = Array.from(new Set(pullRequestInfo.labels.nodes.map(label => label.name)))

  const requiredLabelsRegexMissingMatch = config.requiredLabelsRegex
    .map(function (pattern) {
      const regexObj = new RegExp(pattern, 'ig')
      const matchingLabelExist = pullRequestLabels.some(label => regexObj.test(label))
      if (matchingLabelExist) {
        return null
      } else {
        return pattern
      }
    })
    .filter(label => label != null)

  if (requiredLabelsRegexMissingMatch.length > 0) {
    return {
      status: 'fail',
      message: `Required labels matching regular expression(s) are missing (${
        requiredLabelsRegexMissingMatch.join(', ')
      })`
    }
  }
  return {
    status: 'success'
  }
}
