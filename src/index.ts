import { Application, Context } from 'probot'
import { loadConfig } from './config'
import { HandlerContext } from './models'
import Raven from 'raven'
import { RepositoryWorkers } from './repository-workers'
import sentryStream from 'bunyan-sentry-stream'
import { RepositoryReference, PullRequestReference } from './github-models'
import myAppId from './myappid'

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
      repository: `${options.context.payload.repository.owner.login}/${options.context.payload.repository.name}`
    },
    extra: {
      event: options.context.event
    }
  }, async () => {
    const handlerContext = await getHandlerContext(options)
    await fn(handlerContext)
  })
}

function setupSentry (app: Application) {
  if (process.env.NODE_ENV !== 'production') {
    Raven.disableConsoleAlerts()
  }
  Raven.config(process.env.SENTRY_DSN2, {
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

  app.log.target.addStream(sentryStream(Raven))
}

export = (app: Application) => {
  setupSentry(app)

  const repositoryWorkers = new RepositoryWorkers(
    onPullRequestError
  )

  function onPullRequestError (pullRequest: PullRequestReference, error: any) {
    const repositoryName = `${pullRequest.owner}/${pullRequest.repo}`
    const pullRequestName = `${repositoryName}#${pullRequest.number}`
    Raven.captureException(error, {
      tags: {
        owner: pullRequest.owner,
        repository: repositoryName
      },
      extra: {
        pullRequest: pullRequestName
      }
    })
    console.error(`Error while processing pull request ${pullRequestName}:`, error)
  }

  async function handlePullRequests (app: Application, context: Context, repository: RepositoryReference, headSha: string, pullRequestNumbers: number[]) {
    await useHandlerContext({ app, context }, async (handlerContext) => {
      for (let pullRequestNumber of pullRequestNumbers) {
        repositoryWorkers.queue(handlerContext, {
          owner: repository.owner,
          repo: repository.repo,
          number: pullRequestNumber
        })
      }
    })
  }

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
    await handlePullRequests(app, context, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, context.payload.pull_request.head_sha, [context.payload.pull_request.number])
  })

  app.on([
    'check_run.created',
    'check_run.completed'
  ], async context => {
    if (context.payload.check_run.check_suite.app.id === myAppId) {
      return
    }

    await handlePullRequests(app, context, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, context.payload.check_run.head_sha, context.payload.check_run.pull_requests.map((pullRequest: any) => pullRequest.number))
  })

  app.on([
    'check_run.rerequested',
    'check_run.requested_action'
  ], async context => {
    await handlePullRequests(app, context, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, context.payload.check_run.head_sha, context.payload.check_run.pull_requests.map((pullRequest: any) => pullRequest.number))
  })

  app.on([
    'check_suite.requested',
    'check_suite.rerequested'
  ], async context => {
    await handlePullRequests(app, context, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, context.payload.check_suite.head_sha, context.payload.check_suite.pull_requests.map((pullRequest: any) => pullRequest.number))
  })

  app.on([
    'check_suite.completed'
  ], async context => {
    await handlePullRequests(app, context, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, context.payload.check_suite.head_sha, context.payload.check_suite.pull_requests.map((pullRequest: any) => pullRequest.number))
  })
}
