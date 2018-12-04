import { CommentAuthorAssociation } from './github-models'

export const associations: CommentAuthorAssociation[] = [
  CommentAuthorAssociation.NONE,
  CommentAuthorAssociation.FIRST_TIMER,
  CommentAuthorAssociation.FIRST_TIME_CONTRIBUTOR,
  CommentAuthorAssociation.CONTRIBUTOR,
  CommentAuthorAssociation.COLLABORATOR,
  CommentAuthorAssociation.MEMBER,
  CommentAuthorAssociation.OWNER
]

export function getAssociationPriority (association: CommentAuthorAssociation): number {
  // Note: this will return -1 for any association that is not found.
  // This will prioritise unknown associations lowest.
  return associations.indexOf(association)
}
