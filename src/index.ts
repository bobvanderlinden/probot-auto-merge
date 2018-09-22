import { Application, Context } from 'probot'
import { loadConfig } from './config'
import { HandlerContext } from './models'
import Raven from 'raven'
import { RepositoryWorkers } from './repository-workers'

if (process.env.NODE_ENV === 'production') {
  Raven.config(process.env.SENTRY_DSN, {
    captureUnhandledRejections: true,
    tags: {
      version: process.env.HEROKU_RELEASE_VERSION as string
    },
    release: process.env.SOURCE_VERSION,
    environment: process.env.NODE_ENV || 'development',
    autoBreadcrumbs: {
      'console': true,
      'http': true
    }
  }).install()
}

async function getHandlerContext (options: {app: Application, context: Context}): Promise<HandlerContext> {
  const config = await loadConfig(options.context)
  return {
    config,
    github: options.context.github,
    log: options.app.log
  }
}

async function useHandlerContext (options: {app: Application, context: Context}, fn: (handlerContext: HandlerContext) => Promise<void>): Promise<void> {
  await Raven.context({
    tags: {
      owner: options.context.payload.repository.owner.login,
      repository: options.context.payload.repository.name
    },
    extra: {
      event: options.context.event
    }
  }, async () => {
    const handlerContext = await getHandlerContext(options)
    await fn(handlerContext)
  })
}

export = (app: Application) => {
  const repositoryWorkers = new RepositoryWorkers()
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
    await useHandlerContext({ app, context }, async (handlerContext) => {
      repositoryWorkers.queue(handlerContext, {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        number: context.payload.pull_request.number
      })
    })
  })

  app.on([
    'check_run.created',
    'check_run.rerequested',
    'check_run.requested_action'
  ], async context => {
    await Raven.context({
      extra: {
        event: context.event
      }
    }, async () => {
      await useHandlerContext({ app, context }, async (handlerContext) => {
        for (const pullRequest of context.payload.check_run.pull_requests) {
          repositoryWorkers.queue(handlerContext, {
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            number: pullRequest.number
          })
        }
      })
    })
  })

  app.on([
    'check_suite.completed',
    'check_suite.requested',
    'check_suite.rerequested'
  ], async context => {
    await useHandlerContext({ app, context }, async (handlerContext) => {
      for (const pullRequest of context.payload.check_suite.pull_requests) {
        repositoryWorkers.queue(handlerContext, {
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          number: pullRequest.number
        })
      }
    })
  })
}
