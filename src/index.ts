import { Application, Context } from 'probot'
import { loadConfig } from './config'
import { handlePullRequest, HandlerContext } from './pull-request-handler'
import { handleCheckPullRequests } from './check-handler'

async function getHandlerContext(options: {app: Application, context: Context}): Promise<HandlerContext> {
  const config = await loadConfig(options.context)
  return {
    config,
    github: options.context.github,
    log: options.app.log
  }
}

export = (app: Application) => {
  app.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request_review.submitted',
    'pull_request_review.dismissed',
    'pull_request.synchronize'
  ], async context => {
    const handlerContext = await getHandlerContext({ app, context })
    await handlePullRequest(handlerContext, context.payload.pull_request as any)
  })

  app.on([
    'check_run.created',
    'check_run.rerequested',
    'check_run.requested_action'
  ], async context => {
    const handlerContext = await getHandlerContext({ app, context })
    await handleCheckPullRequests(handlerContext, context.payload.repository.owner.login, context.payload.repository.name, context.payload.check_run.pull_requests)
  })

  app.on([
    'check_suite.completed',
    'check_suite.requested',
    'check_suite.rerequested'
  ], async context => {
    const handlerContext = await getHandlerContext({ app, context })
    await handleCheckPullRequests(handlerContext, context.payload.repository.owner.login, context.payload.repository.name, context.payload.check_suite.pull_requests)
  })
}
