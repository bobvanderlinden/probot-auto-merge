import { HandlerContext, PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function doesNotHaveBlockingLabels (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const { config } = context
  const pullRequestLabels = new Set(pullRequestInfo.labels.nodes.map(label => label.name))
  const foundBlockingLabels = config.blockingLabels
    .filter(blockingLabel => pullRequestLabels.has(blockingLabel))

  if (foundBlockingLabels.length > 0) {
    return {
      status: 'fail',
      message: `Blocking labels are missing (${
        foundBlockingLabels.join(', ')
      })`
    }
  }
  return {
    status: 'success'
  }
}
