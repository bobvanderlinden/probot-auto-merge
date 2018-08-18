import { HandlerContext, PullRequestInfo } from '../models'
import { ConditionResult } from '../condition'

export default function hasUpToDateBranch (
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): ConditionResult {
  const protectedBranch = pullRequestInfo.repository.protectedBranches.nodes
    .filter(protectedBranch => protectedBranch.name === pullRequestInfo.baseRef.name)[0]

  if (protectedBranch
    && protectedBranch.hasStrictRequiredStatusChecks
    && pullRequestInfo.baseRef.target.oid !== pullRequestInfo.baseRefOid) {
    return {
      status: 'fail',
      message: `Pull request is based on a strict protected branch (${
        pullRequestInfo.baseRef.name
      }) and base sha of pull request (${
        pullRequestInfo.baseRefOid
      }) differs from sha of branch (${pullRequestInfo.baseRef.target.oid})`
    }
  }

  return {
    status: 'success'
  }
}
