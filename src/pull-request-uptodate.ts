import { PullRequestInfo } from './github-models'
import minimatch from 'minimatch'

export function requiresBranchUpdate (pullRequestInfo: PullRequestInfo) {
  const matchingBranchProtectionRules = pullRequestInfo.repository.branchProtectionRules.nodes
    .filter(rule => minimatch(pullRequestInfo.baseRef.name, rule.pattern))
  const requiresStrictStatusChecks = matchingBranchProtectionRules.some(rule => rule.requiresStrictStatusChecks)
  return requiresStrictStatusChecks && !isUpToDate(pullRequestInfo)
}

export function isUpToDate (pullRequestInfo: PullRequestInfo) {
  return pullRequestInfo.baseRef.target.oid === pullRequestInfo.baseRefOid
}
