import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function doesNotHaveBlockingLabels (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestLabels = new Set(pullRequestInfo.labels.nodes.map(label => label.name))
  const foundBlockingLabels = config.blockingLabels
    .filter(blockingLabel => pullRequestLabels.has(blockingLabel))

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
