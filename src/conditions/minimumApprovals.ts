import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { getLatestReviews, arrayToMap, or, mapToArray, tryGet } from '../utils'
import { associations, getAssociationPriority } from '../association'

export default function hasMinimumApprovals (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
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
    .some(([association, minApproval]) => or(tryGet(approvalCountByAssociation, association), 0) < minApproval)
    ? {
      status: 'fail',
      message: 'There are not enough approvals by reviewers'
    }
    : {
      status: 'success'
    }
}
