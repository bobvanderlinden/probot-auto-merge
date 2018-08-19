import { ConditionResult } from './../condition'
import open from './open'
import mergeable from './mergeable'
import requiredLabels from './requiredLabels'
import blockingLabels from './blockingLabels'
import blockingChecks from './blockingChecks'
import minimumApprovals from './minimumApprovals'
import maximumChangesRequested from './maximumChangesRequested'
import upToDateBranch from './upToDateBranch'
import { keysOf } from '../utils'

export const conditions = {
  open,
  mergeable,
  requiredLabels,
  blockingLabels,
  minimumApprovals,
  maximumChangesRequested,
  blockingChecks,
  upToDateBranch
}
export const conditionNames: ConditionName[] = keysOf<ConditionName>(conditions)
export type ConditionName = keyof (typeof conditions)
export type ConditionResults = { [key in ConditionName]: ConditionResult }
