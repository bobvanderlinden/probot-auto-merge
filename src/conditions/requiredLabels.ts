import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { matchesPattern, stringifyPattern } from '../pattern'

export default function hasRequiredLabels (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestLabels = pullRequestInfo.labels.nodes.map(label => label.name)

  const missingRequiredLabelPatterns = config.requiredLabels
    .filter(requiredLabelPattern => !pullRequestLabels.some(pullRequestLabel => matchesPattern(requiredLabelPattern, pullRequestLabel)))

  if (missingRequiredLabelPatterns.length > 0) {
    return {
      status: 'fail',
      message: `Required labels are missing (${
        missingRequiredLabelPatterns.map(stringifyPattern).join(', ')
      })`
    }
  }
  return {
    status: 'success'
  }
}
