import { HandlerContext, PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { getLatestReviews, arrayToMap, mapToArray, or, get } from '../utils'
import { associations, getAssociationPriority } from '../association'

export default function doesNotHaveMaximumChangesRequested (context: HandlerContext, pullRequestInfo: PullRequestInfo): ConditionResult {
  const { config } = context

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
