/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: PullRequestQuery
// ====================================================

export interface PullRequestQuery_repository_pullRequest_potentialMergeCommit {
  __typename: "Commit";
  /**
   * The Git object ID
   */
  oid: any;
}

export interface PullRequestQuery_repository_pullRequest_reviews_nodes_author {
  __typename: "Organization" | "User" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface PullRequestQuery_repository_pullRequest_reviews_nodes {
  __typename: "PullRequestReview";
  /**
   * Author's association with the subject of the comment.
   */
  authorAssociation: CommentAuthorAssociation;
  /**
   * The actor who authored the comment.
   */
  author: PullRequestQuery_repository_pullRequest_reviews_nodes_author | null;
  /**
   * Identifies when the Pull Request Review was submitted
   */
  submittedAt: any | null;
  /**
   * Identifies the current state of the pull request review.
   */
  state: PullRequestReviewState;
}

export interface PullRequestQuery_repository_pullRequest_reviews {
  __typename: "PullRequestReviewConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestQuery_repository_pullRequest_reviews_nodes | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest_labels_nodes {
  __typename: "Label";
  /**
   * Identifies the label name.
   */
  name: string;
}

export interface PullRequestQuery_repository_pullRequest_labels {
  __typename: "LabelConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestQuery_repository_pullRequest_labels_nodes | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest_baseRef_repository_owner {
  __typename: "Organization" | "User";
  /**
   * The username used to login.
   */
  login: string;
}

export interface PullRequestQuery_repository_pullRequest_baseRef_repository {
  __typename: "Repository";
  /**
   * The User owner of the repository.
   */
  owner: PullRequestQuery_repository_pullRequest_baseRef_repository_owner;
  /**
   * The name of the repository.
   */
  name: string;
}

export interface PullRequestQuery_repository_pullRequest_baseRef_target {
  __typename: "Commit" | "Tree" | "Blob" | "Tag";
  /**
   * The Git object ID
   */
  oid: any;
}

export interface PullRequestQuery_repository_pullRequest_baseRef {
  __typename: "Ref";
  /**
   * The repository the ref belongs to.
   */
  repository: PullRequestQuery_repository_pullRequest_baseRef_repository;
  /**
   * The object the ref points to.
   */
  target: PullRequestQuery_repository_pullRequest_baseRef_target;
  /**
   * The ref name.
   */
  name: string;
}

export interface PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_app {
  __typename: "App";
  id: string;
}

export interface PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_checkRuns_nodes {
  __typename: "CheckRun";
  id: string;
  /**
   * The name of the check for this check run.
   */
  name: string;
  /**
   * The conclusion of the check run.
   */
  conclusion: CheckConclusionState | null;
  /**
   * The current status of the check run.
   */
  status: CheckStatusState;
}

export interface PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_checkRuns {
  __typename: "CheckRunConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_checkRuns_nodes | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes {
  __typename: "CheckSuite";
  /**
   * The GitHub App which created this check suite.
   */
  app: PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_app | null;
  /**
   * The status of this check suite.
   */
  status: CheckStatusState;
  /**
   * The conclusion of this check suite.
   */
  conclusion: CheckConclusionState | null;
  /**
   * The check runs associated with a check suite.
   */
  checkRuns: PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes_checkRuns | null;
}

export interface PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites {
  __typename: "CheckSuiteConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites_nodes | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest_commits_nodes_commit {
  __typename: "Commit";
  /**
   * The check suites associated with a commit.
   */
  checkSuites: PullRequestQuery_repository_pullRequest_commits_nodes_commit_checkSuites | null;
}

export interface PullRequestQuery_repository_pullRequest_commits_nodes {
  __typename: "PullRequestCommit";
  /**
   * The Git commit object
   */
  commit: PullRequestQuery_repository_pullRequest_commits_nodes_commit;
}

export interface PullRequestQuery_repository_pullRequest_commits {
  __typename: "PullRequestCommitConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestQuery_repository_pullRequest_commits_nodes | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest_headRef_repository_owner {
  __typename: "Organization" | "User";
  /**
   * The username used to login.
   */
  login: string;
}

export interface PullRequestQuery_repository_pullRequest_headRef_repository {
  __typename: "Repository";
  /**
   * The User owner of the repository.
   */
  owner: PullRequestQuery_repository_pullRequest_headRef_repository_owner;
  /**
   * The name of the repository.
   */
  name: string;
}

export interface PullRequestQuery_repository_pullRequest_headRef_target {
  __typename: "Commit" | "Tree" | "Blob" | "Tag";
  /**
   * The Git object ID
   */
  oid: any;
}

export interface PullRequestQuery_repository_pullRequest_headRef {
  __typename: "Ref";
  /**
   * The repository the ref belongs to.
   */
  repository: PullRequestQuery_repository_pullRequest_headRef_repository;
  /**
   * The object the ref points to.
   */
  target: PullRequestQuery_repository_pullRequest_headRef_target;
  /**
   * The ref name.
   */
  name: string;
}

export interface PullRequestQuery_repository_pullRequest_repository_branchProtectionRules_nodes {
  __typename: "BranchProtectionRule";
  /**
   * Identifies the protection rule pattern.
   */
  pattern: string;
  /**
   * Is pushing to matching branches restricted.
   */
  restrictsPushes: boolean;
  /**
   * Are branches required to be up to date before merging.
   */
  requiresStrictStatusChecks: boolean;
  /**
   * List of required status check contexts that must pass for commits to be accepted to matching branches.
   */
  requiredStatusCheckContexts: (string | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest_repository_branchProtectionRules {
  __typename: "BranchProtectionRuleConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestQuery_repository_pullRequest_repository_branchProtectionRules_nodes | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest_repository {
  __typename: "Repository";
  /**
   * A list of branch protection rules for this repository.
   */
  branchProtectionRules: PullRequestQuery_repository_pullRequest_repository_branchProtectionRules;
}

export interface PullRequestQuery_repository_pullRequest {
  __typename: "PullRequest";
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * Identifies the state of the pull request.
   */
  state: PullRequestState;
  /**
   * Whether or not the pull request can be merged based on the existence of merge conflicts.
   */
  mergeable: MergeableState;
  /**
   * The commit that GitHub automatically generated to test if this pull request
   * could be merged. This field will not return a value if the pull request is
   * merged, or if the test merge commit is still being generated. See the
   * `mergeable` field for more details on the mergeability of the pull request.
   */
  potentialMergeCommit: PullRequestQuery_repository_pullRequest_potentialMergeCommit | null;
  /**
   * A list of reviews associated with the pull request.
   */
  reviews: PullRequestQuery_repository_pullRequest_reviews | null;
  /**
   * A list of labels associated with the object.
   */
  labels: PullRequestQuery_repository_pullRequest_labels | null;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * Author's association with the subject of the comment.
   */
  authorAssociation: CommentAuthorAssociation;
  /**
   * Identifies the base Ref associated with the pull request.
   */
  baseRef: PullRequestQuery_repository_pullRequest_baseRef | null;
  /**
   * Identifies the oid of the base ref associated with the pull request, even if the ref has been deleted.
   */
  baseRefOid: any;
  /**
   * A list of commits present in this pull request's head branch not present in the base branch.
   */
  commits: PullRequestQuery_repository_pullRequest_commits;
  /**
   * Identifies the head Ref associated with the pull request.
   */
  headRef: PullRequestQuery_repository_pullRequest_headRef | null;
  /**
   * Identifies the oid of the head ref associated with the pull request, even if the ref has been deleted.
   */
  headRefOid: any;
  /**
   * The repository associated with this node.
   */
  repository: PullRequestQuery_repository_pullRequest_repository;
}

export interface PullRequestQuery_repository {
  __typename: "Repository";
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: PullRequestQuery_repository_pullRequest | null;
}

export interface PullRequestQuery {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: PullRequestQuery_repository | null;
}

export interface PullRequestQueryVariables {
  owner: string;
  repo: string;
  pullRequestNumber: number;
}

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
