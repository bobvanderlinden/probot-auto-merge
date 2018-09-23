import { PullRequestInfo } from './github-models'

export function requiresBranchUpdate (pullRequestInfo: PullRequestInfo) {
  const protectedBranch = pullRequestInfo.repository.protectedBranches.nodes
    .filter(protectedBranch => protectedBranch.name === pullRequestInfo.baseRef.name)[0]

  return protectedBranch
    && protectedBranch.hasStrictRequiredStatusChecks
    && !isUpToDate(pullRequestInfo)
}

export function isUpToDate (pullRequestInfo: PullRequestInfo) {
  return pullRequestInfo.baseRef.target.oid === pullRequestInfo.baseRefOid
}
