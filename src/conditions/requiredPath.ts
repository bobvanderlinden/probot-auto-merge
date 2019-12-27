import { ConditionConfig } from '../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function hasRequiredPaths (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  if (!config.requiredPathRegex) {
    return {
      status: 'success'
    }
  }
  if (pullRequestInfo.changedFiles > 100) {
    return {
      status: 'fail',
      message: 'requiredPath condition supports maximum 100 files per one PR at this moment. Sorry.'
    }
  }

  const regexObj = new RegExp(config.requiredPathRegex, 'ig')
  const pullRequestPaths = new Array(pullRequestInfo.files.nodes.map(file => file.path))
  for (let i = 0; i < pullRequestPaths.length; i++) {
    const fileName = pullRequestPaths[i].toString()
    if (!regexObj.test(fileName)) {
      return {
        status: 'fail',
        message: `Required regular expression ${regexObj} did not match file name ${fileName}`
      }
    }
  }
  return {
    status: 'success'
  }
}
