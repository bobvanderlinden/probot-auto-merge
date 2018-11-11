import { ConditionResult } from './../condition'
import open from './open'
import mergeable from './mergeable'
import requiredLabels from './requiredLabels'
import requiredChecks from './requiredChecks'
import blockingLabels from './blockingLabels'
import blockingChecks from './blockingChecks'
import minimumApprovals from './minimumApprovals'
import maximumChangesRequested from './maximumChangesRequested'
import blockingTitle from './blockingTitle'
import { keysOf } from '../utils'

export const conditions = {
  open,
  mergeable,
  requiredLabels,
  requiredChecks,
  blockingLabels,
  minimumApprovals,
  maximumChangesRequested,
  blockingChecks,
  blockingTitle
}

export type Conditions = typeof conditions
export const conditionNames: ConditionName[] = keysOf<ConditionName>(conditions)
export type ConditionName = keyof (typeof conditions)
export type ConditionResults = { [key in ConditionName]: ConditionResult }
