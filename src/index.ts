import { Application, Context } from 'probot'
import { loadConfig } from './config'
import { schedulePullRequestTrigger } from './pull-request-handler'
import { HandlerContext } from './models';

async function getHandlerContext(options: {app: Application, context: Context}): Promise<HandlerContext | null> {
  const config = await loadConfig(options.context)
  return config && {
    config,
    github: options.context.github,
    log: options.app.log
  }
}

export = (app: Application) => {
  app.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.reopened',
    'pull_request.synchronize',
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.reopened',
    'pull_request_review.submitted',
    'pull_request_review.edited',
    'pull_request_review.dismissed'
  ], async context => {
    const handlerContext = await getHandlerContext({ app, context })
    if (!handlerContext) { return }
    await schedulePullRequestTrigger(handlerContext, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      number: context.payload.pull_request.number
    })
  })

  app.on([
    'check_run.created',
    'check_run.rerequested',
    'check_run.requested_action'
  ], async context => {
    const handlerContext = await getHandlerContext({ app, context })
    if (!handlerContext) { return }
    for(const pullRequest of context.payload.check_run.pull_requests) {
      await schedulePullRequestTrigger(handlerContext, {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        number: pullRequest.number
      })
    }
  })

  app.on([
    'check_suite.completed',
    'check_suite.requested',
    'check_suite.rerequested'
  ], async context => {
    const handlerContext = await getHandlerContext({ app, context })
    if (!handlerContext) { return }
    for(const pullRequest of context.payload.check_suite.pull_requests) {
      await schedulePullRequestTrigger(handlerContext, {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        number: pullRequest.number
      })
    }
  })
}
