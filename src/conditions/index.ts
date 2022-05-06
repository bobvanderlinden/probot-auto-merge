import { ConditionResult } from './../condition'
import { keysOf } from '../utils'
import blockingBody from './blockingBody'
import blockingBaseBranches from './blockingBaseBranches'
import blockingChecks from './blockingChecks'
import blockingLabels from './blockingLabels'
import blockingTitle from './blockingTitle'
import maximumChangesRequested from './maximumChangesRequested'
import maximumPendingReviews from './maximumPendingReviews'
import mergeable from './mergeable'
import minimumApprovals from './minimumApprovals'
import requiredAuthorRole from './requiredAuthorRole'
import requiredReviewers from './requiredReviewers'
import open from './open'
import requiredBaseBranches from './requiredBaseBranches'
// import requiredChecks from './requiredChecks'
import requiredLabels from './requiredLabels'
import requiredBody from './requiredBody'
import requiredTitle from './requiredTitle'

export const conditions = {
  blockingBody,
  blockingBaseBranches,
  blockingChecks,
  blockingLabels,
  blockingTitle,
  maximumChangesRequested,
  maximumPendingReviews,
  mergeable,
  minimumApprovals,
  requiredAuthorRole,
  requiredReviewers,
  open,
  requiredBaseBranches,
  // requiredChecks,
  requiredBody,
  requiredLabels,
  requiredTitle
}

export type Conditions = typeof conditions
export const conditionNames: ConditionName[] = keysOf<ConditionName>(conditions)
export type ConditionName = keyof (typeof conditions)
export type ConditionResults = { [key in ConditionName]: ConditionResult }
