import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { getLatestReviews } from '../utils'

export default function hasRequiredReviewers (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const requiredReviewers = config.requiredReviewers
  const approvedReviewers = getLatestReviews(pullRequestInfo)
    .filter(review => review.state === 'APPROVED')
    .map(review => review.author.login)

  const missingRequiredReviewers = requiredReviewers
    .filter(requiredReviewer => !approvedReviewers.includes(requiredReviewer))

  if (missingRequiredReviewers.length > 0) {
    return {
      status: 'fail',
      message: `Required reviewers are missing (${
        missingRequiredReviewers.join(', ')
      })`
    }
  }
  return {
    status: 'success'
  }
}
