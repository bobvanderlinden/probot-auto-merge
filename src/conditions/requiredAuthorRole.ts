import { ConditionConfig } from './../config'
import { PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'
import { getAssociationPriority } from '../association'

export default function hasRequiredAuthorRole (
  config: ConditionConfig,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  return getAssociationPriority(config.requiredAuthorRole) > getAssociationPriority(pullRequestInfo.authorAssociation)
    ? {
      status: 'fail',
      message: 'The author of the pull request does not have authority for auto-merge'
    }
    : {
      status: 'success'
    }
}
