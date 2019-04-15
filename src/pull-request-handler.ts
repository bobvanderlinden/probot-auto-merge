import { HandlerContext } from './../lib/models.d'
import { PullRequestInfo } from './models'
import { PullRequestStatus } from './pull-request-status'
import { MergeStateStatus } from './query.graphql'
import { Config } from './config'

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
  = 'mergeable_unknown'
  | 'pending_condition'
  | 'failing_condition'
  | 'blocked'
  | 'dirty'
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

export type PullRequestContext = {
  startedAt: Date
} & HandlerContext

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

/**
 * Determines which actions to take based on the pull request and the condition results
 */
export function getPullRequestPlan (
  context: { config: Config },
  pullRequestInfo: PullRequestInfo,
  pullRequestStatus: PullRequestStatus
): PullRequestPlan {
  const { config } = context
  const pendingConditions = Object.entries(pullRequestStatus)
    .filter(([conditionName, conditionResult]) => conditionResult.status === 'pending')
  const failingConditions = Object.entries(pullRequestStatus)
    .filter(([conditionName, conditionResult]) => conditionResult.status === 'fail')

  if (pendingConditions.length > 0) {
    return {
      code: 'pending_condition',
      message: `There are pending conditions:\n\n${getChecksMarkdown(pullRequestStatus)}`,
      actions: ['reschedule']
    }
  }

  if (failingConditions.length > 0) {
    return {
      code: 'failing_condition',
      message: `There are failing conditions:\n\n${getChecksMarkdown(pullRequestStatus)}`,
      actions: []
    }
  }

  switch (pullRequestInfo.mergeStateStatus) {
    case MergeStateStatus.UNKNOWN:
      return {
        code: 'mergeable_unknown',
        message: `GitHub is determining whether the pull request is mergeable`,
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
      return {
        code: 'blocked',
        message: 'The pull request is blocked by a failing or missing check.',
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
          message: 'Will merge the pull request and delete its branch',
          actions: ['merge', 'delete_branch']
        }
      } else {
        return {
          code: 'merge',
          message: 'Will merge the pull request',
          actions: ['merge']
        }
      }
  }
}

function isInFork (pullRequestInfo: PullRequestInfo): boolean {
  return (
    pullRequestInfo.headRef.repository.owner.login !== pullRequestInfo.baseRef.repository.owner.login ||
    pullRequestInfo.headRef.repository.name !== pullRequestInfo.baseRef.repository.name
  )
}

export function getPullRequestActionName (action: PullRequestAction) {
  return ({
    'delete_branch': 'delete branch',
    'merge': 'merge',
    'reschedule': 'reschedule',
    'update_branch': 'update branch'
  })[action]
}
