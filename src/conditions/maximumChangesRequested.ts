import { CommentAuthorAssociation } from './../query.graphql'
import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { getLatestReviews, arrayToMap, mapToArray, or, tryGet } from '../utils'
import { associations, getAssociationPriority } from '../association'

export default function doesNotHaveMaximumChangesRequested (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const latestReviews = getLatestReviews(pullRequestInfo)
  const changesRequestedCountByAssociation: { [key in CommentAuthorAssociation]?: number } =
    arrayToMap(associations,
      (association) => association,
      (association) => latestReviews
        .filter(review => getAssociationPriority(review.authorAssociation) >= getAssociationPriority(association))
        .filter(review => review.state === 'CHANGES_REQUESTED')
        .length
      )

  return mapToArray(config.maxRequestedChanges)
    .some(([association, maxRequestedChanges]) => or<number>(tryGet(changesRequestedCountByAssociation, association), 0) > maxRequestedChanges)
    ? {
      status: 'fail',
      message: `There are changes requested by a reviewer.`
    }
    : {
      status: 'success'
    }
}
