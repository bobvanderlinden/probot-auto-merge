import { ConditionConfig } from '../config'
import { ConditionResult } from '../condition'
import { PullRequestInfo } from '../models'

export default function doesNotHaveBlockingLabelsRegex (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const pullRequestLabels = Array.from(new Set(pullRequestInfo.labels.nodes.map(label => label.name)))

  const foundBlockingLabels = config.blockingLabelsRegex
    .map(function (pattern) {
      const regexObj = new RegExp(pattern, 'ig')
      return pullRequestLabels.map(function (pullRequestLabel) {
        if (regexObj.test(pullRequestLabel)) {
          return pullRequestLabel
        } else {
          return null
        }
      }).filter(label => label != null)
    })
    // TODO: Update the map above to flatMap once es2019 tsconfig is being used, and remove this `reduce`.
    .reduce((result, value) => result.concat(value), [])

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
