import { HandlerContext } from './models'
import { RepositoryReference, PullRequestReference } from './github-models'
import { RepositoryWorker } from './repository-worker'
import { handlePullRequest } from './pull-request-handler'

// TODO: Avoid creating a module-scoped / global variable
// that indirectly influences tests. Use an instance / class
// and instantiate it inside index.ts
const repositoryWorkers: {
  [key: string]: RepositoryWorker
} = {}

function getRepositoryKey ({ owner, repo }: RepositoryReference) {
  return `${owner}/${repo}`
}

export function clearRepositoryWorkers () {
  for (let key in repositoryWorkers) {
    delete repositoryWorkers[key]
  }
}

export function queue (context: HandlerContext, pullRequestReference: PullRequestReference) {
  const queueName = getRepositoryKey(pullRequestReference)
  const repositoryWorker = repositoryWorkers[queueName] = repositoryWorkers[queueName] || new RepositoryWorker(pullRequestReference, context, handlePullRequest)
  context.log.debug('repositoryWorker')
  repositoryWorker.queue({
    type: 'handle',
    pullRequest: pullRequestReference.number
  })
}
