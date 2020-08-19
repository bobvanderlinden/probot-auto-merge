import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { matchesPattern } from '../pattern'

export default function doesNotHaveBlockingLabels (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestLabels = pullRequestInfo.labels.nodes.map(label => label.name)

  const foundBlockingLabels = pullRequestLabels
    .filter(pullRequestLabel => config.blockingLabels.some(blockingLabelPattern => matchesPattern(blockingLabelPattern, pullRequestLabel)))

  if (foundBlockingLabels.length > 0) {
    return {
      status: 'fail',
      message: `Blocking labels are present (${
        foundBlockingLabels.join(', ')
      })`
    }
  }
  return {
    status: 'success'
  }
}
