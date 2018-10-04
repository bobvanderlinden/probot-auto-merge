import Raven from 'raven'
import { conditions } from './conditions/index'
import { HandlerContext, PullRequestReference, PullRequestInfo } from './models'
import { result } from './utils'
import { getPullRequestStatus, PullRequestStatus } from './pull-request-status'
import { queryPullRequest } from './pull-request-query'
import { requiresBranchUpdate } from './pull-request-uptodate'

export interface PullRequestContext extends HandlerContext {
  reschedulePullRequest: () => void
}

export async function handlePullRequest (
  context: PullRequestContext,
  pullRequestReference: PullRequestReference
) {
  const { log } = context
  context.log.debug('Querying', pullRequestReference)
  const pullRequestInfo = await queryPullRequest(
    context.github,
    pullRequestReference
  )

  Raven.mergeContext({
    extra: {
      pullRequestInfo
    }
  })

  const pullRequestStatus = getPullRequestStatus(
    context,
    conditions,
    pullRequestInfo
  )

  context.log.debug('pullRequestStatus:', pullRequestStatus)

  Raven.mergeContext({
    extra: {
      pullRequestStatus
    }
  })

  log(`result:\n${JSON.stringify(pullRequestStatus, null, 2)}`)
  await handlePullRequestStatus(
    context,
    pullRequestInfo,
    pullRequestStatus
  )
}

export type PullRequestAction = 'reschedule' | 'update_branch' | 'merge' | 'delete_branch'
export type PullRequestActions
  = []
  | ['reschedule']
  | ['update_branch', 'reschedule']
  | ['merge']
  | ['merge', 'delete_branch']

/**
 * Determines which actions to take based on the pull request and the condition results
 */
export function getPullRequestActions (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo,
  pullRequestStatus: PullRequestStatus
): PullRequestActions {
  const { config } = context
  const pending = Object.values(pullRequestStatus)
    .some(conditionResult => conditionResult.status === 'pending')
  const success = Object.values(pullRequestStatus)
    .every(conditionResult => conditionResult.status === 'success')

  if (pending) {
    return ['reschedule']
  }

  if (!success) {
    return []
  }

  // If the pull request is not up-to-date failed and we have updateBranch enabled,
  // update the branch of the PR.
  if (requiresBranchUpdate(pullRequestInfo) && config.updateBranch) {
    return isInFork(pullRequestInfo)
      ? []
      : ['update_branch', 'reschedule']
  }

  return config.deleteBranchAfterMerge && !isInFork(pullRequestInfo)
    ? ['merge', 'delete_branch']
    : ['merge']
}

function isInFork (pullRequestInfo: PullRequestInfo): boolean {
  return (
    pullRequestInfo.headRef.repository.owner.login !== pullRequestInfo.baseRef.repository.owner.login ||
    pullRequestInfo.headRef.repository.name !== pullRequestInfo.baseRef.repository.name
  )
}

/**
 * Deletes the branch of the pull request
 */
async function deleteBranch (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
) {
  return result(
    await context.github.gitdata.deleteReference({
      owner: pullRequestInfo.headRef.repository.owner.login,
      repo: pullRequestInfo.headRef.repository.name,
      ref: `heads/${pullRequestInfo.headRef.name}`
    })
  )
}

export async function executeActions (
  context: PullRequestContext,
  pullRequestInfo: PullRequestInfo,
  actions: PullRequestAction[]
) {
  for (let action of actions) {
    await executeAction(context, pullRequestInfo, action)
  }
}

export async function executeAction (
  context: PullRequestContext,
  pullRequestInfo: PullRequestInfo,
  action: PullRequestAction
): Promise<void> {
  context.log.debug('Executing action:', action)
  switch (action) {
    case 'update_branch':
      return updateBranch(context, pullRequestInfo)
    case 'reschedule':
      return context.reschedulePullRequest()
    case 'merge':
      return mergePullRequest(context, pullRequestInfo)
    case 'delete_branch':
      return deleteBranch(context, pullRequestInfo)
    default:
      throw new Error('Invalid PullRequestAction ' + action)
  }
}

/**
 * Merges the base reference of the pull request onto the pull request branch
 * This is the equivalent of pushing the 'Update branch' button
 */
async function updateBranch (
  context: PullRequestContext,
  pullRequestInfo: PullRequestInfo
) {
  // This merges the baseRef on top of headRef of the PR.
  return result(await context.github.repos.merge({
    owner: pullRequestInfo.headRef.repository.owner.login,
    repo: pullRequestInfo.headRef.repository.name,
    base: pullRequestInfo.headRef.name,
    head: pullRequestInfo.baseRef.name
  }))
}

function getPullRequestReference (pullRequestInfo: PullRequestInfo) {
  return {
    owner: pullRequestInfo.baseRef.repository.owner.login,
    repo: pullRequestInfo.baseRef.repository.name,
    number: pullRequestInfo.number
  }
}

/**
 * Presses the merge button on a pull request
 */
async function mergePullRequest (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
) {
  const { config } = context
  const pullRequestReference = getPullRequestReference(pullRequestInfo)
  // This presses the merge button.
  result(
    await context.github.pullRequests.merge({
      ...pullRequestReference,
      merge_method: config.mergeMethod
    })
  )
}

export async function handlePullRequestStatus (
  context: PullRequestContext,
  pullRequestInfo: PullRequestInfo,
  pullRequestStatus: PullRequestStatus
) {
  const actions = getPullRequestActions(context, pullRequestInfo, pullRequestStatus)
  context.log.debug('Actions:', actions)
  await executeActions(context, pullRequestInfo, actions)
}
