import Raven from 'raven'
import { TaskScheduler } from './task-scheduler'
import { HandlerContext, PullRequestReference, PullRequestInfo } from './models'
import { result } from './utils'
import { getPullRequestStatus, PullRequestStatus } from './pull-request-status'
import { queryPullRequest } from './pull-request-query'
const debug = require('debug')('pull-request-handler')

interface PullRequestTask {
  context: HandlerContext
  PullRequestReference: PullRequestReference
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
  PullRequestReference: PullRequestReference
) {
  const queueName = getRepositoryKey(PullRequestReference)
  const queueContainsTask = taskScheduler.getQueue(queueName)
    .some(task => arePullRequestReferencesEqual(task.PullRequestReference, PullRequestReference))
  if (!queueContainsTask) {
    taskScheduler.queue(queueName, { context, PullRequestReference })
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
  PullRequestReference
}: PullRequestTask) {
  await Raven.context({
    tags: {
      owner: PullRequestReference.owner,
      repository: PullRequestReference.repo,
      pullRequestNumber: PullRequestReference.number
    }
  }, async () => {
    await handlePullRequestTrigger(context, PullRequestReference)
  })
}

async function handlePullRequestTrigger (
  context: HandlerContext,
  PullRequestReference: PullRequestReference
) {
  const { log: appLog } = context
  const pullRequestKey = getPullRequestKey(PullRequestReference)

  function log (msg: string) {
    appLog(`${pullRequestKey}: ${msg}`)
  }

  // Cancel any running scheduled timer for this pull request,
  // since we're now handling it right now.
  clearTimeout(pullRequestTimeouts[pullRequestKey])

  const pullRequestContext = {
    ...context,
    log
  }
  await doPullRequestWork(pullRequestContext, PullRequestReference)
}

async function doPullRequestWork (
  context: HandlerContext,
  PullRequestReference: PullRequestReference
) {
  const { log } = context
  const pullRequestInfo = await queryPullRequest(
    context.github,
    PullRequestReference
  )

  const pullRequestStatus = await getPullRequestStatus(
    context,
    pullRequestInfo
  )

  Raven.mergeContext({
    tags: {
      pullRequestStatus: pullRequestStatus.code
    }
  })

  log(`result: ${pullRequestStatus.code}: ${pullRequestStatus.message}`)
  await handlePullRequestStatus(context, pullRequestInfo, pullRequestStatus)
}

export async function handlePullRequestStatus (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo,
  pullRequestStatus: PullRequestStatus
) {
  const { log, github, config } = context
  const pullRequestReference: PullRequestReference = {
    owner: pullRequestInfo.baseRef.repository.owner.login,
    repo: pullRequestInfo.baseRef.repository.name,
    number: pullRequestInfo.number
  }
  switch (pullRequestStatus.code) {
    case 'ready_for_merge':
      // We're ready for merging!
      // This presses the merge button.
      result(
        await github.pullRequests.merge({
          ...pullRequestReference,
          merge_method: config.mergeMethod
        })
      )
      if (config.deleteBranchAfterMerge) {
        // Check whether the pull request's branch was actually part of the same repo, as
        // we do not want to (or rather do not have permission to) alter forks of this repo.
        if (
          pullRequestInfo.headRef.repository.owner.login === pullRequestInfo.baseRef.repository.owner.login &&
          pullRequestInfo.headRef.repository.name === pullRequestInfo.baseRef.repository.name
        ) {
          result(
            await github.gitdata.deleteReference({
              owner: pullRequestInfo.headRef.repository.owner.login,
              repo: pullRequestInfo.headRef.repository.name,
              ref: `heads/${pullRequestInfo.headRef.name}`
            })
          )
        }
      }
      return
    case 'out_of_date_branch':
      if (config.updateBranch) {
        // This merges the baseRef on top of headRef of the PR.
        result(await github.repos.merge({
          owner: pullRequestInfo.headRef.repository.owner.login,
          repo: pullRequestInfo.headRef.repository.name,
          base: pullRequestInfo.headRef.name,
          head: pullRequestInfo.baseRef.name
        }))
      }
      return
    case 'pending_checks':
      // Some checks (like Travis) seem to not always send
      // their status updates. Making this process being stalled.
      // We work around this issue by scheduling a recheck after
      // 1 minutes. The recheck is cancelled once another pull
      // request event comes by.
      log('Scheduling pull request trigger after 1 minutes')
      const pullRequestKey = getPullRequestKey(pullRequestReference)
      debug(`Setting timeout for ${pullRequestKey}`)
      pullRequestTimeouts[pullRequestKey] = setTimeout(() => {
        /* istanbul ignore next */
        debug(`Timeout triggered for ${pullRequestKey}`)
        /* istanbul ignore next */
        schedulePullRequestTrigger(context, pullRequestReference)
      }, 1 * 60 * 1000)
      return
    default:
    // We will just wait for a next event from GitHub.
  }
}
