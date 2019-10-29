import { PullRequestInfo } from './models'
import { Config } from './config'

export function getCommitMessage (
  pullRequestInfo: PullRequestInfo,
  config: Config
) {
  return config.mergeCommitMessage
    ? getCustomCommitMessage(pullRequestInfo, config.mergeCommitMessage)
    : null
}

export function splitCommitMessage (message: string) {
  const [title, ...body] = message.trim().split('\n')

  return {
    title: title.trim(),
    body: body.join('\n').trim()
  }
}

type Tag = 'title' | 'body' | 'number' | 'branch' | 'commits'

type Tags = {
  [key in Tag]: (pullRequestInfo: PullRequestInfo) => string
}

function getCustomCommitMessage (
  pullRequestInfo: PullRequestInfo,
  template: string
) {
  const tagReplacers: Tags = {
    title: pullRequestInfo => pullRequestInfo.title,
    body: pullRequestInfo => pullRequestInfo.body,
    number: pullRequestInfo => pullRequestInfo.number.toString(),
    branch: pullRequestInfo => pullRequestInfo.headRefName,
    commits: pullRequestInfo => pullRequestInfo.allCommits.nodes.map(node => {
      return `* ${node.commit.messageHeadline} (${node.commit.abbreviatedOid})`
    }).join('\n\n')
  }

  return (Object.keys(tagReplacers) as Tag[]).reduce((message, tagName) => {
    return message.replace(`{${tagName}}`, tagReplacers[tagName](pullRequestInfo))
  }, template)
}
