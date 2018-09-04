import { conditions } from './conditions/index'
import Raven from 'raven'
import { TaskScheduler } from './task-scheduler'
import { HandlerContext, PullRequestReference, PullRequestInfo } from './models'
import { result } from './utils'
import { getPullRequestStatus, PullRequestStatus } from './pull-request-status'
import { queryPullRequest } from './pull-request-query'
const debug = require('debug')('pull-request-handler')

interface PullRequestTask {
  context: HandlerContext
  pullRequestReference: PullRequestReference
}

const taskScheduler = new TaskScheduler<PullRequestTask>({
  worker: pullRequestWorker,
  concurrency: 8,
  errorHandler: (error, queueName) => {
    debug(`Error during handling of pull request task on queue ${queueName}`, error)
    Raven.captureException(error, {
      tags: {
        queue: queueName
      }
    }, undefined)
  }
})
const pullRequestTimeouts: {
  [key: string]: NodeJS.Timer;
} = {}

export function arePullRequestReferencesEqual (a: PullRequestReference, b: PullRequestReference) {
  return a.number === b.number
    && a.owner === b.owner
    && a.repo === b.owner
}

export function schedulePullRequestTrigger (
  context: HandlerContext,
  pullRequestReference: PullRequestReference
) {
  const queueName = getRepositoryKey(pullRequestReference)
  const queueContainsTask = taskScheduler.getQueue(queueName)
    .some(task => arePullRequestReferencesEqual(task.pullRequestReference, pullRequestReference))
  if (!queueContainsTask) {
    taskScheduler.queue(queueName, { context, pullRequestReference })
  }
}

function getRepositoryKey ({ owner, repo }: { owner: string, repo: string }) {
  return `${owner}/${repo}`
}

function getPullRequestKey (pullRequestReference: PullRequestReference) {
  return `${pullRequestReference.owner}/${pullRequestReference.repo}#${pullRequestReference.number}`
}

async function pullRequestWorker ({
  context,
  pullRequestReference
}: PullRequestTask) {
  await Raven.context({
    tags: {
      owner: pullRequestReference.owner,
      repository: pullRequestReference.repo,
      pullRequestNumber: pullRequestReference.number
    }
  }, async () => {
    await handlePullRequestTrigger(context, pullRequestReference)
  })
}

async function handlePullRequestTrigger (
  context: HandlerContext,
  pullRequestReference: PullRequestReference
) {
  const pullRequestKey = getPullRequestKey(pullRequestReference)

  // Cancel any running scheduled timer for this pull request,
  // since we're now handling it right now.
  clearTimeout(pullRequestTimeouts[pullRequestKey])

  const pullRequestContext = {
    ...context,
    log: context.log.child({
      options: {
        pullRequest: pullRequestReference.number
      }
    })
  }
  await doPullRequestWork(pullRequestContext, pullRequestReference)
}

async function doPullRequestWork (
  context: HandlerContext,
  pullRequestReference: PullRequestReference
) {
  const { log } = context
  const pullRequestInfo = await queryPullRequest(
    context.github,
    pullRequestReference
  )

  const pullRequestStatus = getPullRequestStatus(
    context,
    conditions,
    pullRequestInfo
  )

  Raven.mergeContext({
    extra: {
      pullRequestStatus
    }
  })

  log(`result:\n${JSON.stringify(pullRequestStatus, null, 2)}`)
  await handlePullRequestStatus(context, pullRequestInfo, pullRequestStatus)
}

export type PullRequestAction = 'reschedule' | 'update_branch' | 'merge' | 'delete_branch'
export type PullRequestActions
  = []
  | ['reschedule']
  | ['update_branch']
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

  // If upToDateBranch condition has failed, but all other conditions have succeeded
  // and we have updateBranch enabled, update the branch of the PR.
  if (pullRequestStatus.upToDateBranch.status === 'fail'
    && config.updateBranch
    && Object.entries(pullRequestStatus)
      .filter(([name, _]) => name !== 'upToDateBranch')
      .every(([_, value]) => value.status === 'success')
  ) {
    return isInFork(pullRequestInfo)
      ? []
      : ['update_branch']
  }

  if (!success) {
    return []
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
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo,
  actions: PullRequestAction[]
) {
  for (let action of actions) {
    await executeAction(context, pullRequestInfo, action)
  }
}

export async function executeAction (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo,
  action: PullRequestAction
): Promise<void> {
  switch (action) {
    case 'update_branch':
      return updateBranch(context, pullRequestInfo)
    case 'reschedule':
      return reschedulePullRequest(context, pullRequestInfo)
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
  context: HandlerContext,
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
 * Reschedules the pull request for later evaluation
 */
async function reschedulePullRequest (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
) {
  const pullRequestReference = getPullRequestReference(pullRequestInfo)
  // Some checks (like Travis) seem to not always send
  // their status updates. Making this process being stalled.
  // We work around this issue by scheduling a recheck after
  // 1 minutes. The recheck is cancelled once another pull
  // request event comes by.
  context.log('Scheduling pull request trigger after 1 minutes')
  const pullRequestKey = getPullRequestKey(pullRequestReference)
  debug(`Setting timeout for ${pullRequestKey}`)
  pullRequestTimeouts[pullRequestKey] = setTimeout(() => {
    debug(`Timeout triggered for ${pullRequestKey}`)
    schedulePullRequestTrigger(context, pullRequestReference)
  }, 1 * 60 * 1000)
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
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo,
  pullRequestStatus: PullRequestStatus
) {
  const actions = getPullRequestActions(context, pullRequestInfo, pullRequestStatus)
  await executeActions(context, pullRequestInfo, actions)
}
