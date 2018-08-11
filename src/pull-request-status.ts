import { HandlerContext, PullRequestInfo } from './models'
import { groupByLast, groupByLastMap } from './utils'
import { associations, getAssociationPriority } from './association'

export type PullRequestStatus =
  | {
    code:
        | 'merged'
        | 'closed'
        | 'not_open'
        | 'requires_label'
        | 'blocking_label'
        | 'pending_mergeable'
        | 'conflicts'
        | 'changes_requested'
        | 'need_approvals'
        | 'pending_checks'
        | 'blocking_check'
        | 'out_of_date_branch'
        | 'ready_for_merge';
    message: string;
  }

export type PullRequestStatusCode = PullRequestStatus['code']

export const PullRequestStatusCodes: PullRequestStatusCode[] = [
  'merged',
  'closed',
  'not_open',
  'pending_mergeable',
  'conflicts',
  'changes_requested',
  'need_approvals',
  'pending_checks',
  'blocking_check',
  'out_of_date_branch',
  'ready_for_merge'
]

function getPullRequestStatusFromPullRequest (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): PullRequestStatus | null {
  switch (pullRequestInfo.state) {
    case 'CLOSED':
      return {
        code: 'closed',
        message: 'Pull request is closed'
      }
    case 'MERGED':
      return {
        code: 'merged',
        message: 'Pull request was already merged'
      }
    default:
      return {
        code: 'not_open',
        message: 'Pull request is not open'
      }
    case 'OPEN':
      // Continue.
      break
  }

  switch (pullRequestInfo.mergeable) {
    case 'CONFLICTING':
      return {
        code: 'conflicts',
        message: 'Could not merge pull request due to conflicts'
      }
    case 'UNKNOWN':
      return {
        code: 'pending_mergeable',
        message: 'Mergeablity of pull request could not yet be determined'
      }
    case 'MERGEABLE':
      // Continue.
      break
  }
  return null
}

function getPullRequestStatusFromLabels (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): PullRequestStatus | null {
  const { config } = context
  function hasLabel (labelName: string): boolean {
    return pullRequestInfo.labels.nodes.some(label => label.name === labelName)
  }

  const missingRequiredLabels = config.requiredLabels.filter(
    requiredLabel => !hasLabel(requiredLabel)
  )
  if (missingRequiredLabels.length > 0) {
    return {
      code: 'requires_label',
      message: `Required labels are missing (${missingRequiredLabels.join(
        ', '
      )})`
    }
  }

  const matchingBlockingLabels = config.blockingLabels.filter(
    blockingLabel => hasLabel(blockingLabel)
  )
  if (matchingBlockingLabels.length > 0) {
    return {
      code: 'blocking_label',
      message: `Blocking labels were added to the pull request (${
        matchingBlockingLabels.join(', ')
      })`
    }
  }

  return null
}

function getPullRequestStatusFromReviews (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): PullRequestStatus | null {
  const { config, log } = context
  const sortedReviews = pullRequestInfo.reviews.nodes.sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  )
  const latestReviewsByUser = groupByLast(
    review => review.author.login,
    sortedReviews
  )

  const reviewSummary = Object.entries(latestReviewsByUser)
    .map(([user, review]) => `${user}: ${review.state}`)
    .join('\n')

  log(`\nReviews:\n${reviewSummary}\n\n`)

  const latestReviews = Object.values(latestReviewsByUser)

  let approvedByOneAssociation = false
  for (let association of associations) {
    const associationReviews = latestReviews.filter(review => getAssociationPriority(review.authorAssociation) >= getAssociationPriority(association))

    const changesRequestedCount = associationReviews.filter(review => review.state === 'CHANGES_REQUESTED').length
    const maxRequestedChanges = config.maxRequestedChanges[association]
    if (maxRequestedChanges !== undefined && changesRequestedCount > maxRequestedChanges) {
      return {
        code: 'changes_requested',
        message: `There are changes requested by a reviewer.`
      }
    }

    const approvalCount = associationReviews.filter(review => review.state === 'APPROVED').length
    const minApprovals = config.minApprovals[association]
    if (minApprovals !== undefined && approvalCount >= minApprovals) {
      approvedByOneAssociation = true
    }
  }

  if (approvedByOneAssociation) {
    return null
  } else {
    return {
      code: 'need_approvals',
      message: `There are not enough approvals by reviewers`
    }
  }
}

function getPullRequestStatusFromChecks (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): PullRequestStatus | null {
  const { log } = context
  const checkRuns = pullRequestInfo.checkRuns
  // log('checks: ' + JSON.stringify(checks))
  const checksSummary = checkRuns
    .map(
      checkRun => `${checkRun.name}: ${checkRun.status}: ${checkRun.conclusion}`
    )
    .join('\n')

  log(`\nChecks:\n${checksSummary}\n\n`)

  const allChecksCompleted = checkRuns.every(
    checkRun => checkRun.status === 'completed'
  )
  if (!allChecksCompleted) {
    return {
      code: 'pending_checks',
      message: 'There are still pending checks'
    }
  }
  const checkConclusions = groupByLastMap(
    checkRun => checkRun.conclusion,
    _ => true,
    checkRuns
  )
  log('conclusions: ' + JSON.stringify(checkConclusions))
  const checksBlocking =
    checkConclusions.failure ||
    checkConclusions.cancelled ||
    checkConclusions.timed_out ||
    checkConclusions.action_required
  if (checksBlocking) {
    return {
      code: 'blocking_check',
      message: 'There are blocking checks'
    }
  }

  return null
}

function getPullRequestStatusFromProtectedBranch (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): PullRequestStatus | null {
  const protectedBranch = pullRequestInfo.repository.protectedBranches.nodes
    .filter(protectedBranch => protectedBranch.name === pullRequestInfo.baseRef.name)[0]

  if (protectedBranch
    && protectedBranch.hasStrictRequiredStatusChecks
    && pullRequestInfo.baseRef.target.oid !== pullRequestInfo.baseRefOid) {
    return {
      code: 'out_of_date_branch',
      message: `Pull request is based on a strict protected branch (${
        pullRequestInfo.baseRef.name
      }) and base sha of pull request (${
        pullRequestInfo.baseRefOid
      }) differs from sha of branch (${pullRequestInfo.baseRef.target.oid})`
    }
  }

  return null
}

export async function getPullRequestStatus (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): Promise<PullRequestStatus> {
  return (
    getPullRequestStatusFromPullRequest(context, pullRequestInfo) ||
    getPullRequestStatusFromLabels(context, pullRequestInfo) ||
    getPullRequestStatusFromReviews(context, pullRequestInfo) ||
    getPullRequestStatusFromChecks(context, pullRequestInfo) ||
    getPullRequestStatusFromProtectedBranch(context, pullRequestInfo) || {
      code: 'ready_for_merge',
      message: 'Pull request successfully merged'
    }
  )
}
