import { PullRequestContext } from './pull-request-handler'
import { PullRequestInfo } from './models'
import { ChecksCreateParams } from '@octokit/rest'
import { getMyCheckSuite } from './utils'

export async function updateStatusReportCheck (
  context: PullRequestContext,
  pullRequestInfo: PullRequestInfo,
  title: string,
  summary: string
) {
  const myCheckRun = getMyCheckSuite(pullRequestInfo)
    .checkRuns.nodes[0]

  const checkOptions: {
    conclusion: 'neutral',
    status: 'completed',
    name: string,
    completed_at: string,
    output: ChecksCreateParams['output'],
    owner: string,
    repo: string
  } = {
    conclusion: 'neutral',
    status: 'completed',
    name: 'auto-merge',
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
      check_run_id: parseInt(myCheckRun.id, 10),
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
