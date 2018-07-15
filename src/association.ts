import { Association } from "./github-models";

export const associations: Association[] = [
  'NONE',
  'FIRST_TIMER',
  'FIRST_TIME_CONTRIBUTOR',
  'CONTRIBUTOR',
  'COLLABORATOR',
  'MEMBER',
  'OWNER'
]

export function getAssociationPriority(association: Association): number {
  // Note: this will return -1 for any association that is not found.
  // This will prioritise unknown associations lowest.
  return associations.indexOf(association);
}
