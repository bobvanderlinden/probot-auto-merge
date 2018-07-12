import { Context } from 'probot'
import { Config } from './config'
import { handlePullRequest } from './pull-request-handler'

export async function handleCheckPullRequests(context: Context, pullRequests: CheckPullRequest[], config: Config) {
  for(const checkPullRequest of pullRequests) {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const number = checkPullRequest.number
    const pullRequestResponse = await context.github.pullRequests.get({owner, repo, number})
    const pullRequest = pullRequestResponse.data
    await handlePullRequest(context, pullRequest, config)
  }
}