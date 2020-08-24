import { PullRequestContext } from './pull-request-handler'
import { PullRequestInfo } from './models'
import { ChecksCreateParams } from '@octokit/rest'
import { getMyCheckSuite } from './utils'
import { CheckConclusionState } from './github-models'

function getOctokitConclusion (value: ReportCheckConclusion | undefined) {
  switch (value) {
    case CheckConclusionState.NEUTRAL:
      return 'neutral'
    case CheckConclusionState.SUCCESS:
      return 'success'
    case undefined:
      return 'neutral'
  }
}

export type ReportCheckConclusion = CheckConclusionState.NEUTRAL | CheckConclusionState.SUCCESS

type CheckOptions = Omit<ChecksCreateParams, 'head_sha'>

export async function updateStatusReportCheck (
  context: PullRequestContext,
  pullRequestInfo: PullRequestInfo,
  title: string,
  summary: string,
  conclusion?: ReportCheckConclusion
) {
  const myCheckSuite = getMyCheckSuite(pullRequestInfo)
  const myCheckRun = myCheckSuite && myCheckSuite.checkRuns.nodes[0]

  const checkOptions: CheckOptions = {
    conclusion: getOctokitConclusion(conclusion),
    status: 'completed',
    name: 'auto-merge',
    started_at: context.startedAt.toISOString(),
    completed_at: new Date().toISOString(),
    output: {
      title,
      summary
    },
    owner: pullRequestInfo.baseRef.repository.owner.login,
    repo: pullRequestInfo.baseRef.repository.name
  }

  if (myCheckRun) {
    // Whenever we find an existing check_run from this app,
    // we will update that check_run.
    await context.github.checks.update({
      check_run_id: myCheckRun.databaseId,
      ...checkOptions
    })
  } else if (context.config.reportStatus) {
    // Whenever we did not find an existing check_run we will
    // only create a new one if reportStatus is enabled
    // in their repository.

    await context.github.checks.create({
      head_sha: pullRequestInfo.headRefOid,
      ...checkOptions
    })
  }
}
