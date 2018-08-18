import { HandlerContext, PullRequestInfo } from './models'
import { ConditionResult, Condition } from './condition'
import open from './conditions/open'
import mergeable from './conditions/mergeable'
import requiredLabels from './conditions/requiredLabels'
import blockingLabels from './conditions/blockingLabels'
import blockingChecks from './conditions/blockingChecks'
import minimumApprovals from './conditions/minimumApprovals'
import maximumChangesRequested from './conditions/maximumChangesRequested'
import upToDateBranch from './conditions/upToDateBranch'

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
  open,
  mergeable,
  requiredLabels,
  blockingLabels,
  minimumApprovals,
  maximumChangesRequested,
  blockingChecks,
  upToDateBranch
}

type ConditionName = keyof (typeof conditions)
type ConditionResults = { [key in ConditionName]: ConditionResult }

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
