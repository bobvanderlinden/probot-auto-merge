import { HandlerContext, PullRequestInfo, PullRequestInfo } from './../lib/src/models.d';
import { PullRequestInfo, PullRequestInfo, CommentAuthorAssociation, PullRequestReviewState } from './github-models';
import { HandlerContext, PullRequestInfo } from './models'
import { groupByLast, groupByLastMap, result } from './utils'
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

const conditions = {
  open: isOpen,
  mergeable: isMergeable,
  requiredLabels: hasRequiredLabels,
  blockingLabels: doesNotHaveBlockingLabels,
  minimumApprovals: hasMinimumApprovals,
  maximumChangesRequested: doesNotHaveMaximumChangesRequested,
  blockingChecks: doesNotHaveBlockingChecks,
  upToDateBranch: hasUpToDateBranch
}

type Condition = (context: HandlerContext, pullRequestInfo: PullRequestInfo) => ConditionResult
type ConditionName = keyof (typeof conditions)
type ConditionResult = { status: 'success' } | { status: 'fail', message: string } | { status: 'pending', message?: string }
type ConditionResults = { [key in ConditionName]: ConditionResult }

function isOpen (context: HandlerContext, pullRequestInfo: PullRequestInfo): ConditionResult {
  return pullRequestInfo.state === 'OPEN'
    ? {
      status: 'success'
    }
    : {
      status: 'fail',
      message: `State of pull request is ${pullRequestInfo.state}`
    }
}

function isMergeable (context: HandlerContext, pullRequestInfo: PullRequestInfo): ConditionResult {
  switch (pullRequestInfo.mergeable) {
    case 'MERGEABLE':
      return {
        status: 'success'
      }
    case 'CONFLICTING':
      return {
        status: 'fail',
        message: 'Pull request has conflicts'
      }
    case 'UNKNOWN':
      return {
        status: 'pending',
        message: 'Github could not yet determine the mergeable status of the pull request'
      }
    default:
      throw new Error(`Invalid mergeable state for pull request. mergeable=${pullRequestInfo.mergeable}`)
  }
}

function hasRequiredLabels (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const { config } = context
  const pullRequestLabels = new Set(pullRequestInfo.labels.nodes.map(label => label.name))

  const missingRequiredLabels = config.requiredLabels
    .filter(requiredLabel => !pullRequestLabels.has(requiredLabel))

  if (missingRequiredLabels.length > 0) {
    return {
      status: 'fail',
      message: `Required labels are missing (${
        missingRequiredLabels.join(', ')
      })`
    }
  }
  return {
    status: 'success'
  }
}

function doesNotHaveBlockingLabels (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const { config } = context
  const pullRequestLabels = new Set(pullRequestInfo.labels.nodes.map(label => label.name))
  const foundBlockingLabels = config.blockingLabels
    .filter(blockingLabel => pullRequestLabels.has(blockingLabel))

  if (foundBlockingLabels.length > 0) {
    return {
      status: 'fail',
      message: `Blocking labels are missing (${
        foundBlockingLabels.join(', ')
      })`
    }
  }
  return {
    status: 'success'
  }
}

function merge<A, B> (a: A, b: B): A & B {
  return Object.assign({}, a, b) as any
}

function arrayToMap<TKey extends string, TValue, TItem> (
  arr: Array<TItem>,
  keyFn: (item: TItem) => TKey,
  valueFn: (item: TItem) => TValue
): { [key in TKey]?: TValue } {
  return arr.reduce((result: { [key in TKey]?: TValue }, item) => merge(result, {
    [keyFn(item)]: valueFn(item)
  }), {})
}

function or<TValue> (optional: TValue | undefined, defaultValue: TValue): TValue {
  return optional === undefined
    ? defaultValue
    : optional
}

function groupByCount<TKey extends string, TItem> (
  arr: Array<TItem>,
  keyFn: (item: TItem) => TKey
): { [key in TKey]?: number } {
  return arr.reduce((result: { [key in TKey]?: number }, item) => {
    const key = keyFn(item)
    const previousValue = result[key]
    const newValue = or<number>(previousValue, 0) + 1
    return merge(result, {
      [key]: newValue + 1
    })
  }, {})
}

function mapToArray<TKey extends string, TValue> (map: { [key in TKey]?: TValue }) {
  return Object.entries(map)
}

function get<TKey extends string, TValue> (obj: { [key in TKey]: TValue }, key: TKey): TValue {
  return obj[key]
}

function getLatestReviews (pullRequestInfo: PullRequestInfo) {
  const sortedReviews = pullRequestInfo.reviews.nodes.sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  )
  const latestReviewsByUser = groupByLast(
    review => review.author.login,
    sortedReviews
  )

  const latestReviews = Object.values(latestReviewsByUser)
  return latestReviews
}

function doesNotHaveMaximumChangesRequested (context: HandlerContext, pullRequestInfo: PullRequestInfo): ConditionResult {
  const { config, log } = context

  const latestReviews = getLatestReviews(pullRequestInfo)
  const changesRequestedCountByAssociation =
    arrayToMap(associations,
      (association) => association,
      (association) => latestReviews
        .filter(review => getAssociationPriority(review.authorAssociation) >= getAssociationPriority(association))
        .filter(review => review.state === 'CHANGES_REQUESTED')
        .length
      )

  return mapToArray(config.maxRequestedChanges)
    .some(([association, maxRequestedChanges]) => or(get(changesRequestedCountByAssociation, association), 0) > maxRequestedChanges)
    ? {
      status: 'fail',
      message: `There are changes requested by a reviewer.`
    }
    : {
      status: 'success'
    }
}

function hasMinimumApprovals (context: HandlerContext, pullRequestInfo: PullRequestInfo): ConditionResult {
  const { config } = context

  const latestReviews = getLatestReviews(pullRequestInfo)
  const approvalCountByAssociation =
    arrayToMap(associations,
      (association) => association,
      (association) => latestReviews
        .filter(review => getAssociationPriority(review.authorAssociation) >= getAssociationPriority(association))
        .filter(review => review.state === 'APPROVED')
        .length
      )

  return mapToArray(config.minApprovals)
    .some(([association, minApproval]) => or(get(approvalCountByAssociation, association), 0) < minApproval)
    ? {
      status: 'fail',
      message: 'There are not enough approvals by reviewers'
    }
    : {
      status: 'success'
    }
}

function doesNotHaveBlockingChecks (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const checkRuns = pullRequestInfo.checkRuns
  const allChecksCompleted = checkRuns.every(
    checkRun => checkRun.status === 'completed'
  )
  if (!allChecksCompleted) {
    return {
      status: 'pending',
      message: 'There are still pending checks'
    }
  }
  const checkConclusions = groupByLastMap(
    checkRun => checkRun.conclusion,
    _ => true,
    checkRuns
  )
  const checksBlocking =
    checkConclusions.failure ||
    checkConclusions.cancelled ||
    checkConclusions.timed_out ||
    checkConclusions.action_required
  if (checksBlocking) {
    return {
      status: 'fail',
      message: 'There are blocking checks'
    }
  }
  return {
    status: 'success'
  }
}

function hasUpToDateBranch (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const protectedBranch = pullRequestInfo.repository.protectedBranches.nodes
    .filter(protectedBranch => protectedBranch.name === pullRequestInfo.baseRef.name)[0]

  if (protectedBranch
    && protectedBranch.hasStrictRequiredStatusChecks
    && pullRequestInfo.baseRef.target.oid !== pullRequestInfo.baseRefOid) {
    return {
      status: 'fail',
      message: `Pull request is based on a strict protected branch (${
        pullRequestInfo.baseRef.name
      }) and base sha of pull request (${
        pullRequestInfo.baseRefOid
      }) differs from sha of branch (${pullRequestInfo.baseRef.target.oid})`
    }
  }

  return {
    status: 'success'
  }
}

function mapObject<TKey extends string, TValue, TMappedValue> (obj: { [key in TKey]: TValue }, mapper: (value: TValue) => TMappedValue): { [key in TKey]: TMappedValue } {
  const result: any = {}
  for (let key in obj) {
    result[key] = mapper(obj[key])
  }
  return result
}

export function getConditionResults (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): ConditionResults {
  return mapObject<ConditionName, Condition, ConditionResult>(
    conditions,
    (condition: Condition) => condition(context, pullRequestInfo)
  )
}

function isFail (conditionResult: ConditionResult): boolean {
  return conditionResult.status === 'fail'
}

function getPullRequestStatusCode (results: ConditionResults): PullRequestStatusCode {
  if (isFail(results.open)) {
    return 'not_open'
  } else if (isFail(results.mergeable)) {
    return 'conflicts'
  } else if (results.mergeable.status === 'pending') {
    return 'pending_mergeable'
  } else if (isFail(results.requiredLabels)) {
    return 'requires_label'
  } else if (isFail(results.blockingLabels)) {
    return 'blocking_label'
  } else if (isFail(results.maximumChangesRequested)) {
    return 'changes_requested'
  } else if (isFail(results.minimumApprovals)) {
    return 'need_approvals'
  } else if (isFail(results.blockingChecks)) {
    return 'blocking_check'
  } else if (results.blockingChecks.status === 'pending') {
    return 'pending_checks'
  } else if (isFail(results.upToDateBranch)) {
    return 'out_of_date_branch'
  } else {
    return 'ready_for_merge'
  }
}

export async function getPullRequestStatus (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): Promise<PullRequestStatus> {
  const results = getConditionResults(context, pullRequestInfo)
  return {
    code: pullRequestInfo.state === 'CLOSED'
    ? 'closed'
    : pullRequestInfo.state === 'MERGED'
    ? 'merged'
    : getPullRequestStatusCode(results),
    message: ''
  }
}
