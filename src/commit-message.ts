import { PullRequestInfo } from './models'
import { Config } from './config'

export function previewCommitMesage (
  pullRequestInfo: PullRequestInfo,
  config: Config
) {
  return config.mergeCommitMessage
    ? getCustomCommitMessage(pullRequestInfo, config.mergeCommitMessage)
    : getPotentialCommitMessage(pullRequestInfo)
}

function getPotentialCommitMessage (pullRequestInfo: PullRequestInfo) {
  return 'potential commit message'
}

function getCustomCommitMessage (
  pullRequestInfo: PullRequestInfo,
  template: string
) {
  return 'custom commit message'
}
