import { handlePullRequest, HandlerContext } from './pull-request-handler'
import { CheckPullRequest } from './models'

export async function handleCheckPullRequests(context: HandlerContext, owner: string, repo: string, pullRequests: CheckPullRequest[]) {
  for(const checkPullRequest of pullRequests) {
    const number = checkPullRequest.number
    const pullRequestResponse = await context.github.pullRequests.get({owner, repo, number})
    const pullRequest = pullRequestResponse.data
    await handlePullRequest(context, pullRequest)
  }
}