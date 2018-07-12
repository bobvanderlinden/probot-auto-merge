import { Application } from 'probot'
import { loadConfig } from './config'
import { handlePullRequest } from './pull-request-handler'
import { handleCheckPullRequests } from './check-handler'

export = (app: Application) => {
  app.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request_review.submitted',
    'pull_request_review.dismissed',
    'pull_request.synchronize'
  ], async context => {
    const config = await loadConfig(context)
    await handlePullRequest(context, context.payload.pull_request as any, config)
  })

  app.on([
    'check_run.created',
    'check_run.rerequested',
    'check_run.requested_action'
  ], async context => {
    const config = await loadConfig(context)
    await handleCheckPullRequests(context, context.payload.check_run.pull_requests, config)
  })

  app.on([
    'check_suite.completed',
    'check_suite.requested',
    'check_suite.rerequested'
  ], async context => {
    const config = await loadConfig(context)
    await handleCheckPullRequests(context, context.payload.check_suite.pull_requests, config)
  })
}