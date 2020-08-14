import { ConditionResult } from './../condition'
import { keysOf } from '../utils'
import blockingBody from './blockingBody'
import blockingChecks from './blockingChecks'
import blockingLabels from './blockingLabels'
import blockingLabelsRegex from './blockingLabelsRegex'
import blockingTitle from './blockingTitle'
import maximumChangesRequested from './maximumChangesRequested'
import mergeable from './mergeable'
import minimumApprovals from './minimumApprovals'
import open from './open'
// import requiredChecks from './requiredChecks'
import requiredLabels from './requiredLabels'
import requiredLabelsRegex from './requiredLabelsRegex'
import requiredBody from './requiredBody'
import requiredTitle from './requiredTitle'

export const conditions = {
  blockingBody,
  blockingChecks,
  blockingLabels,
  blockingLabelsRegex,
  blockingTitle,
  maximumChangesRequested,
  mergeable,
  minimumApprovals,
  open,
  // requiredChecks,
  requiredBody,
  requiredLabels,
  requiredLabelsRegex,
  requiredTitle
}

export type Conditions = typeof conditions
export const conditionNames: ConditionName[] = keysOf<ConditionName>(conditions)
export type ConditionName = keyof (typeof conditions)
export type ConditionResults = { [key in ConditionName]: ConditionResult }
