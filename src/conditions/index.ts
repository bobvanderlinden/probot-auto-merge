import { ConditionResult } from './../condition'
import { keysOf } from '../utils'
import blockingBody from './blockingBody'
import blockingChecks from './blockingChecks'
import blockingLabels from './blockingLabels'
import blockingTitle from './blockingTitle'
import maximumChangesRequested from './maximumChangesRequested'
import mergeable from './mergeable'
import minimumApprovals from './minimumApprovals'
import requiredReviewers from './requiredReviewers'
import open from './open'
// import requiredChecks from './requiredChecks'
import requiredLabels from './requiredLabels'
import requiredBody from './requiredBody'
import requiredTitle from './requiredTitle'

export const conditions = {
  blockingBody,
  blockingChecks,
  blockingLabels,
  blockingTitle,
  maximumChangesRequested,
  mergeable,
  minimumApprovals,
  requiredReviewers,
  open,
  // requiredChecks,
  requiredBody,
  requiredLabels,
  requiredTitle
}

export type Conditions = typeof conditions
export const conditionNames: ConditionName[] = keysOf<ConditionName>(conditions)
export type ConditionName = keyof (typeof conditions)
export type ConditionResults = { [key in ConditionName]: ConditionResult }
