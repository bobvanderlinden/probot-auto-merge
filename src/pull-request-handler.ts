import { Application, Context } from 'probot'
import { Config } from './config'
import { PullRequest, Review, ReviewState, CheckRun } from './models'

import { groupBy, groupByMap } from "./utils";

export interface HandlerContext {
  log: Application['log']
  github: Context['github']
  config: Config
}

export async function handlePullRequest(context: HandlerContext, pullRequest: PullRequest) {
  const { log: appLog, github, config } = context

  const repo = pullRequest.base.repo.name
  const owner = pullRequest.base.user.login
  const number = pullRequest.number

  function log(msg: string) {
    appLog(`${repo}/${owner} #${number}: ${msg}`)
  }

  if (pullRequest.merged) {
    log('Pull request was already merged')
    return
  }

  if (pullRequest.state !== 'open') {
    log('Pull request not open')
    return
  }

  if (!pullRequest.mergeable) {
    log('Pull request is not mergeable: ' + pullRequest.mergeable)
    return
  }

  const reviewsResponse = await github.pullRequests.getReviews({owner, repo, number})
  const reviews: Review[] = reviewsResponse.data
  const sortedReviews = reviews
    .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
  const latestReviewsByUser = groupBy(
    review => review.user.login,
    sortedReviews
  )

  const reviewSummary = Object.entries(latestReviewsByUser)
    .map(([user, state]) => `${user}: ${state}`)
    .join('\n')

  log(`\nReviews:\n${reviewSummary}\n\n`)

  const latestReviews = Object.values(latestReviewsByUser)
  const changesRequestedCount = latestReviews.filter(review => review.state === 'CHANGES_REQUESTED').length
  if (changesRequestedCount > config["max-requested-changes"]) {
    log(`There are changes requested by a reviewer (${changesRequestedCount} / ${config["max-requested-changes"]})`)
    return
  }

  const approvalCount = latestReviews.filter(review => review.state === 'APPROVED').length
  if (approvalCount < config["min-approvals"]) {
    log(`There are not enough approvals by reviewers (${approvalCount} / ${config["min-approvals"]})`)
    return
  }

  const checksResponse = await github.checks.listForRef({owner, repo, ref: pullRequest.head.sha, filter: 'latest' })
  const checkRuns: CheckRun[] = checksResponse.data.check_runs
  // log('checks: ' + JSON.stringify(checks))
  const checksSummary = checkRuns.map(checkRun => `${checkRun.name}: ${checkRun.status}: ${checkRun.conclusion}`).join('\n')

  log(`\nChecks:\n${checksSummary}\n\n`)

  const allChecksCompleted = checkRuns.every(checkRun => checkRun.status === 'completed')
  if (!allChecksCompleted) {
    log(`There are still pending checks. Scheduling recheck.`)
    setTimeout(async () => {
      await handlePullRequest(context, pullRequest)
    }, 60000)
    return
  }
  const checkConclusions = groupByMap(
    checkRun => checkRun.conclusion,
    _ => true,
    checkRuns
  )
  log('conclusions: ' + JSON.stringify(checkConclusions))
  const checksBlocking = checkConclusions.failure || checkConclusions.cancelled || checkConclusions.timed_out || checkConclusions.action_required
  if (checksBlocking) {
    log(`There are blocking checks`)
    return
  }

  await github.pullRequests.merge({owner, repo, number, merge_method: config["merge-method"]})
  // await github.issues.createComment({owner, repo, number, body: 'I want to merge this right now'})
  log('Merge pull request')
}
