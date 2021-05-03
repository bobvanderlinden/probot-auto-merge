import { Application, Context } from 'probot'
import { loadConfig, ConfigNotFoundError, ConfigValidationError } from './config'
import { WorkerContext } from './models'
import Raven from 'raven'
import { RepositoryWorkers } from './repository-workers'
import sentryStream from 'bunyan-sentry-stream'
import { RepositoryReference, PullRequestReference } from './github-models'
import myAppId from './myappid'
import { queryPullRequest } from './pull-request-query'
import bunyan from 'bunyan'
import { wrapLogger } from 'probot/lib/wrap-logger'
import { PassThrough } from 'stream'
import { GitHubAPI } from 'probot/lib/github'
import { rawGraphQLQuery } from './github-utils'
import express from 'express'
import bodyParser from 'body-parser'

async function getWorkerContext (options: {app: Application, context: Context, installationId: number}): Promise<WorkerContext> {
  const { app, context, installationId } = options
  const config = await loadConfig(context)
  const log = context.log
  const createGitHubAPI = async () => {
    return app.auth(installationId, log)
  }
  return {
    createGitHubAPI,
    log,
    config
  }
}

async function useWorkerContext (options: {app: Application, context: Context, installationId: number}, fn: (WorkerContext: WorkerContext) => Promise<void>): Promise<void> {
  await Raven.context({
    tags: {
      owner: options.context.payload.repository.owner.login,
      repository: `${options.context.payload.repository.owner.login}/${options.context.payload.repository.name}`
    },
    extra: {
      event: options.context.event
    }
  }, async () => {
    let workerContext
    try {
      workerContext = await getWorkerContext(options)
    } catch (err) {
      if (err instanceof ConfigNotFoundError || err instanceof ConfigValidationError) {
        // Skip worker callback as we cannot create a context. We also do not raise this error as this is part of
        // normal behaviour.
        return
      } else {
        throw err
      }
    }

    await fn(workerContext)
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
      console: true,
      http: true
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

  async function handlePullRequests (app: Application, context: Context, installationId: number, repository: RepositoryReference, pullRequestNumbers: number[]) {
    await useWorkerContext({ app, context, installationId }, async (workerContext) => {
      for (const pullRequestNumber of pullRequestNumbers) {
        repositoryWorkers.queue(workerContext, {
          owner: repository.owner,
          repo: repository.repo,
          number: pullRequestNumber
        })
      }
    })
  }

  async function getAssociatedPullRequests (github: GitHubAPI, { owner, repo, headRefOid }: { owner: String, repo: string, headRefOid: string }): Promise<{ owner: string, repo: string, number: number }[]> {
    const result = await rawGraphQLQuery(github, `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: 10, states: OPEN, orderBy: { field: UPDATED_AT, direction: DESC}) {
            edges {
              node {
                number
                headRefOid
                repository {
                  name
                  owner {
                    login
                  }
                }
              }
            }
          }
        }
      }
    `, {
      owner,
      repo
    }, {})
    if (!result.data) { return [] }
    const allPullRequests = result.data.repository.pullRequests.edges
      .filter(({ node }: any) => node.headRefOid === headRefOid)
      .map(({ node }: any) => ({
        number: node.number,
        repo: node.repository.name,
        owner: node.repository.owner.login
      }))

    return allPullRequests
  }

  app.on([
    'status'
  ], async context => {
    const pullRequests = await getAssociatedPullRequests(context.github, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      headRefOid: context.payload.sha
    })

    await Promise.all(pullRequests.map(pullRequest => {
      const repositoryReference = {
        owner: pullRequest.owner,
        repo: pullRequest.repo
      }
      return handlePullRequests(app, context, context.payload.installation.id, repositoryReference, [pullRequest.number])
    }))
  })

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
    'pull_request_review.dismissed',
    'pull_request.trigger'
  ], async context => {
    await handlePullRequests(app, context, context.payload.installation.id, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, [context.payload.pull_request.number])
  })

  app.on([
    'check_run.created',
    'check_run.completed'
  ], async context => {
    if (context.payload.check_run.check_suite.app.id === myAppId) {
      return
    }

    await handlePullRequests(app, context, context.payload.installation.id, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, context.payload.check_run.pull_requests.map((pullRequest: any) => pullRequest.number))
  })

  app.on([
    'check_run.rerequested',
    'check_run.requested_action'
  ], async context => {
    await handlePullRequests(app, context, context.payload.installation.id, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, context.payload.check_run.pull_requests.map((pullRequest: any) => pullRequest.number))
  })

  app.on([
    'check_suite.requested',
    'check_suite.rerequested'
  ], async context => {
    await handlePullRequests(app, context, context.payload.installation.id, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, context.payload.check_suite.pull_requests.map((pullRequest: any) => pullRequest.number))
  })

  app.on([
    'check_suite.completed'
  ], async context => {
    await handlePullRequests(app, context, context.payload.installation.id, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }, context.payload.check_suite.pull_requests.map((pullRequest: any) => pullRequest.number))
  })

  const router = express.Router()
  if (process.env.DEBUG_TOKEN) {
    app.router.use('/api', router)
  }
  router.use((req, res, next) => {
    if (req.query.token !== process.env.DEBUG_TOKEN) {
      return res.status(403).send('')
    }
    return next()
  })
  router.use(bodyParser())
  router.get('/queue', (req, res) => {
    const result = Object.entries(repositoryWorkers.getRepositoryWorkers())
      .map(([name, worker]) => {
        const workerQueue = {
          current: worker.getCurrentTask(),
          queue: worker.getQueuedTasks()
        }
        return [name, workerQueue] as [string, typeof workerQueue]
      })
      .reduce((result, [name, worker]) => ({ ...result, [name]: worker }), {})
    res.json(result)
  })
  router.get('/trigger', async (req, res) => {
    const owner = req.query.owner as string
    const repo = req.query.repo as string
    const pullRequestNumber = parseInt(req.query.pullRequestNumber as string, 10)
    app.auth()
      .then(async (appOctokit: GitHubAPI) => {
        const { data: installation } = await appOctokit.apps.findRepoInstallation({ owner, repo })
        const event: any = {
          id: '1',
          name: 'pull_request',
          payload: {
            action: 'trigger',
            installation,
            repository: {
              owner: {
                login: owner
              },
              name: repo
            },
            pull_request: {
              number: pullRequestNumber
            }
          }
        }
        await app.receive(event)
        res.json({ status: 'ok' })
      })
      .catch(err => {
        res.status(500).json({ status: 'error', error: err.toString() })
      })
  })

  router.get('/run', async (req, res) => {
    const owner = req.query.owner as string
    const repo = req.query.repo as string
    const pullRequestNumber = parseInt(req.query.pullRequestNumber as string, 10)
    app.auth()
      .then(async (appOctokit: GitHubAPI) => {
        const { data: installation } = await appOctokit.apps.findRepoInstallation({ owner, repo })
        const github = await app.auth(installation.id)
        const event: any = {
          id: '1',
          name: 'pull_request',
          payload: {
            action: 'trigger',
            installation,
            repository: {
              owner: {
                login: owner
              },
              name: repo
            },
            pull_request: {
              number: pullRequestNumber
            }
          }
        }

        const logStream = new PassThrough({
          autoDestroy: true,
          allowHalfOpen: true,
          emitClose: true
        })
        logStream.pipe(res)
        const log = wrapLogger(bunyan.createLogger({
          name: 'http',
          stream: logStream,
          level: 'debug'
        }))

        log.info('Started logging')

        const context = new Context(event, github, log)

        await handlePullRequests(app, context, installation.id, { owner, repo }, [pullRequestNumber])

        req.connection.once('close', () => {
          res.end()
        })
      })
      .catch(err => {
        res.status(500).json({ status: 'error', error: err.toString() })
      })
  })

  router.get('/query', async (req, res) => {
    const owner = req.query.owner as string
    const repo = req.query.repo as string
    const pullRequestNumber = parseInt(req.query.pullRequestNumber as string, 10)
    app.auth()
      .then(async (appOctokit: GitHubAPI) => {
        const { data: installation } = await appOctokit.apps.findRepoInstallation({ owner, repo })
        const repoOctokit = await app.auth(installation.id)
        const result = await queryPullRequest(repoOctokit, { owner, repo, number: pullRequestNumber })
        res.json(result)
      })
      .catch(err => {
        res.status(500).json({ status: 'error', error: err.toString() })
      })
  })

  router.post('/graphql', async (req, res) => {
    const owner = req.query.owner as string
    const repo = req.query.repo as string
    app.auth()
      .then(async (appOctokit: GitHubAPI) => {
        const { data: installation } = await appOctokit.apps.findRepoInstallation({ owner, repo })
        const repoOctokit = await app.auth(installation.id)
        const response = await repoOctokit.query(req.body.query, req.body.variables, { Accept: req.headers.accept, ...req.body.headers })
        return res.json(response)
      })
      .catch(err => {
        res.status(500).json({ status: 'error', error: err.toString() })
      })
  })
}
