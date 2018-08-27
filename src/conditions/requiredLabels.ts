import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function hasRequiredLabels (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestLabels = new Set(pullRequestInfo.labels.nodes.map(label => label.name))

  const missingRequiredLabels = config.requiredLabels
    .filter(requiredLabel => !pullRequestLabels.has(requiredLabel))

  if (missingRequiredLabels.length > 0) {
    return {
      status: 'fail',
      message: `Required labels are missing (${
        missingRequiredLabels.join(', ')
      })`
    }
  }
  return {
    status: 'success'
  }
}
