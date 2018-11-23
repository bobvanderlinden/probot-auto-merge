/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * The possible states for a check suite or run conclusion.
 */
export enum CheckConclusionState {
  ACTION_REQUIRED = "ACTION_REQUIRED",
  CANCELLED = "CANCELLED",
  FAILURE = "FAILURE",
  NEUTRAL = "NEUTRAL",
  SUCCESS = "SUCCESS",
  TIMED_OUT = "TIMED_OUT",
}

/**
 * The possible states for a check suite or run status.
 */
export enum CheckStatusState {
  COMPLETED = "COMPLETED",
  IN_PROGRESS = "IN_PROGRESS",
  QUEUED = "QUEUED",
  REQUESTED = "REQUESTED",
}

/**
 * A comment author association with repository.
 */
export enum CommentAuthorAssociation {
  COLLABORATOR = "COLLABORATOR",
  CONTRIBUTOR = "CONTRIBUTOR",
  FIRST_TIMER = "FIRST_TIMER",
  FIRST_TIME_CONTRIBUTOR = "FIRST_TIME_CONTRIBUTOR",
  MEMBER = "MEMBER",
  NONE = "NONE",
  OWNER = "OWNER",
}

/**
 * Detailed status information about a pull request merge.
 */
export enum MergeStateStatus {
  BEHIND = "BEHIND",
  BLOCKED = "BLOCKED",
  CLEAN = "CLEAN",
  DIRTY = "DIRTY",
  HAS_HOOKS = "HAS_HOOKS",
  UNKNOWN = "UNKNOWN",
  UNSTABLE = "UNSTABLE",
}

/**
 * Whether or not a PullRequest can be merged.
 */
export enum MergeableState {
  CONFLICTING = "CONFLICTING",
  MERGEABLE = "MERGEABLE",
  UNKNOWN = "UNKNOWN",
}

/**
 * The possible states of a pull request review.
 */
export enum PullRequestReviewState {
  APPROVED = "APPROVED",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  COMMENTED = "COMMENTED",
  DISMISSED = "DISMISSED",
  PENDING = "PENDING",
}

/**
 * The possible states of a pull request.
 */
export enum PullRequestState {
  CLOSED = "CLOSED",
  MERGED = "MERGED",
  OPEN = "OPEN",
}

//==============================================================
// END Enums and Input Objects
//==============================================================
