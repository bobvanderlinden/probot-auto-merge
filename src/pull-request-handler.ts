import Raven from 'raven'
import { conditions } from './conditions/index'
import { HandlerContext, PullRequestReference, PullRequestInfo } from './models'
import { result } from './utils'
import { getPullRequestStatus, PullRequestStatus } from './pull-request-status'
import { queryPullRequest } from './pull-request-query'
import { updateStatusReportCheck } from './status-report'
import { MergeStateStatus, PullRequestState, CheckConclusionState } from './query.graphql'
import { Config } from './config'
import { getCommitMessage, splitCommitMessage } from './commit-message'

export interface PullRequestContext extends HandlerContext {
  reschedulePullRequest: () => void,
  startedAt: Date
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
  = (
    []
    | ['reschedule']
    | ['update_branch', 'reschedule']
    | ['merge']
    | ['merge', 'delete_branch']
  ) & Array<PullRequestAction>

export type PullRequestPlanCode
  = 'closed'
  | 'merged'
  | 'mergeable_unknown'
  | 'mergeable_not_supplied'
  | 'pending_condition'
  | 'failing_condition'
  | 'blocked'
  | 'dirty'
  | 'draft'
  | 'out_of_date'
  | 'out_of_date_on_fork'
  | 'update_branch'
  | 'merge_and_delete'
  | 'merge'

export type PullRequestPlan = {
  code: PullRequestPlanCode,
  message: string,
  actions: PullRequestActions
}

type ExtraMergeParams = {
  commit_title?: string
  commit_message?: string
}

function getChecksMarkdown (pullRequestStatus: PullRequestStatus) {
  return Object.entries(pullRequestStatus)
    .map(([name, result]) => {
      switch (result.status) {
        case 'success':
          return `* ✓ \`${name}\``
        case 'pending':
          return `* ○ \`${name}\`${result.message && `: ${result.message}`}`
        case 'fail':
          return `* ✘ \`${name}\`: ${result.message}`
        default:
          throw new Error(`Unknown status in result: ${JSON.stringify(result)}`)
      }
    })
    .join('\n')
}

function markdownParagraphs (paragraphs: string[]) {
  return paragraphs
    .filter(paragraph => paragraph)
    .join('\n\n')
}

function getCommitMessageMarkdown (pullRequestInfo: PullRequestInfo, config: Config) {
  const commitMessage = getCommitMessage(pullRequestInfo, config)

  if (commitMessage === null) {
    return ''
  }

  const quotedCommitMessage = commitMessage.split('\n').map(line => `> ${line}`).join('\n')

  return markdownParagraphs([
    'Commit message preview:',
    quotedCommitMessage
  ])
}

/**
 * Determines which actions to take based on the pull request and the condition results
 */
export function getPullRequestPlan (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo,
  pullRequestStatus: PullRequestStatus
): PullRequestPlan {
  const { config } = context

  if (pullRequestInfo.state === PullRequestState.MERGED) {
    return {
      code: 'merged',
      message: 'Pull request was merged already',
      actions: []
    }
  }

  if (pullRequestInfo.state === PullRequestState.CLOSED || pullRequestStatus.open.status === 'fail') {
    return {
      code: 'closed',
      message: 'Pull request was closed',
      actions: []
    }
  }

  const pendingConditions = Object.entries(pullRequestStatus)
    .filter(([conditionName, conditionResult]) => conditionResult.status === 'pending')
  const failingConditions = Object.entries(pullRequestStatus)
    .filter(([conditionName, conditionResult]) => conditionResult.status === 'fail')

  if (pendingConditions.length > 0) {
    return {
      code: 'pending_condition',
      message: markdownParagraphs([
        'There are pending conditions:',
        getChecksMarkdown(pullRequestStatus),
        getCommitMessageMarkdown(pullRequestInfo, config)
      ]),
      actions: ['reschedule']
    }
  }

  if (failingConditions.length > 0) {
    return {
      code: 'failing_condition',
      message: markdownParagraphs([
        'There are failing conditions:',
        getChecksMarkdown(pullRequestStatus),
        getCommitMessageMarkdown(pullRequestInfo, config)
      ]),
      actions: []
    }
  }

  switch (pullRequestInfo.mergeStateStatus) {
    case MergeStateStatus.UNKNOWN:
      return {
        code: 'mergeable_unknown',
        message: 'GitHub is determining whether the pull request is mergeable',
        actions: ['reschedule']
      }
    case MergeStateStatus.BEHIND:
      if (!config.updateBranch) {
        return {
          code: 'out_of_date',
          message: 'The pull request is out-of-date.',
          actions: []
        }
      } else if (isInFork(pullRequestInfo)) {
        return {
          code: 'out_of_date_on_fork',
          message: 'The pull request is out-of-date, but the head is located in another repository',
          actions: []
        }
      } else {
        return {
          code: 'update_branch',
          message: 'The pull request is out-of-date. Will update it now.',
          actions: ['update_branch', 'reschedule']
        }
      }
    case MergeStateStatus.BLOCKED:
      // The GitHub documentation for the status BLOCKED is rather vague.
      // We presume that branch protection rules is likely the cause of BLOCKED status.
      // See: https://docs.github.com/en/graphql/reference/enums#mergestatestatus
      return {
        code: 'blocked',
        message: `Merging the pull request is blocked by branch protection rules. Please make sure probot-auto-merge has permission to push to \`${pullRequestInfo.baseRef.name}\` under the "Restrict who can push to matching branches" section the branch protection rules.`,
        actions: []
      }
    case MergeStateStatus.DIRTY:
      return {
        code: 'dirty',
        message: 'The pull request has a merge conflict.',
        actions: []
      }
    case MergeStateStatus.UNSTABLE:
    case MergeStateStatus.HAS_HOOKS:
    case MergeStateStatus.CLEAN:
      if (config.deleteBranchAfterMerge && !isInFork(pullRequestInfo)) {
        return {
          code: 'merge_and_delete',
          message: markdownParagraphs([
            'Will merge the pull request and delete its branch.',
            getCommitMessageMarkdown(pullRequestInfo, config)
          ]),
          actions: ['merge', 'delete_branch']
        }
      } else {
        return {
          code: 'merge',
          message: markdownParagraphs([
            'Will merge the pull request.',
            getCommitMessageMarkdown(pullRequestInfo, config)
          ]),
          actions: ['merge']
        }
      }
    case MergeStateStatus.DRAFT:
      return {
        code: 'draft',
        message: 'Pull request is marked as draft',
        actions: []
      }
    case null:
      return {
        code: 'mergeable_not_supplied',
        message: 'GitHub did not provide merge state of PR',
        actions: ['reschedule']
      }
    default:
      Raven.mergeContext({
        extra: { pullRequestInfo }
      })
      throw new Error(`Merge state (${pullRequestInfo.mergeStateStatus}) was not recognized`)
  }
}

function isInFork (pullRequestInfo: PullRequestInfo): boolean {
  return pullRequestInfo.headRef && (
    pullRequestInfo.headRef.repository.owner.login !== pullRequestInfo.baseRef.repository.owner.login ||
    pullRequestInfo.headRef.repository.name !== pullRequestInfo.baseRef.repository.name
  ) || false
}

/**
 * Deletes the branch of the pull request
 */
async function deleteBranch (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
) {
  const headRef = pullRequestInfo.headRef
  if (!headRef) {
    throw new Error('headRef was null while it is required for deleting branches')
  }
  return result(
    await context.github.git.deleteRef({
      owner: headRef.repository.owner.login,
      repo: headRef.repository.name,
      ref: `heads/${headRef.name}`
    })
  )
}

export async function executeActions (
  context: PullRequestContext,
  pullRequestInfo: PullRequestInfo,
  actions: PullRequestAction[]
) {
  for (const action of actions) {
    try {
      await executeAction(context, pullRequestInfo, action)
    } catch (err) {
      await updateStatusReportCheck(context, pullRequestInfo, `Failed to ${getPullRequestActionName(action)}`, err.toString())
      throw err
    }
  }
}

export function getPullRequestActionName (action: PullRequestAction) {
  return ({
    delete_branch: 'delete branch',
    merge: 'merge',
    reschedule: 'reschedule',
    update_branch: 'update branch'
  })[action]
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
  const headRef = pullRequestInfo.headRef
  if (!headRef) {
    throw new Error('headRef was null while it is required for updating branches')
  }
  // This merges the baseRef on top of headRef of the PR.
  return result(await context.github.repos.merge({
    owner: headRef.repository.owner.login,
    repo: headRef.repository.name,
    base: headRef.name,
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
  const extraParams: ExtraMergeParams = {}
  const pullRequestReference = getPullRequestReference(pullRequestInfo)
  const commitMessage = getCommitMessage(pullRequestInfo, config)

  if (commitMessage !== null) {
    const commitMessageParams = splitCommitMessage(commitMessage)
    extraParams.commit_title = commitMessageParams.title
    extraParams.commit_message = commitMessageParams.body
  }

  // This presses the merge button.
  result(
    await context.github.pulls.merge({
      owner: pullRequestReference.owner,
      repo: pullRequestReference.repo,
      pull_number: pullRequestReference.number,
      merge_method: config.mergeMethod,
      ...extraParams
    })
  )
}

function getPlanTitle (plan: PullRequestPlan) {
  return plan.actions.some(action => action === 'merge')
    ? 'Merging'
    : plan.actions.some(action => action === 'update_branch')
      ? 'Updating branch'
      : plan.actions.some(action => action === 'reschedule')
        ? 'Waiting'
        : plan.code === 'merged'
          ? 'Merged'
          : plan.code === 'closed'
            ? 'Closed'
            : 'Not merging'
}

function getPlanConclusion (plan: PullRequestPlan) {
  return plan.code === 'merged' || plan.code === 'closed'
    ? CheckConclusionState.SUCCESS
    : CheckConclusionState.NEUTRAL
}

export async function handlePullRequestStatus (
  context: PullRequestContext,
  pullRequestInfo: PullRequestInfo,
  pullRequestStatus: PullRequestStatus
) {
  const plan = getPullRequestPlan(context, pullRequestInfo, pullRequestStatus)
  const title = getPlanTitle(plan)
  const conclusion = getPlanConclusion(plan)

  await updateStatusReportCheck(context, pullRequestInfo, title, plan.message, conclusion)

  const { actions } = plan
  context.log.debug('Actions:', actions)
  await executeActions(context, pullRequestInfo, actions)
}
