import { HandlerContext } from './models'
import { RepositoryReference, PullRequestReference } from './github-models'
import { RepositoryWorker } from './repository-worker'
import { handlePullRequest } from './pull-request-handler'

export class RepositoryWorkers {
  constructor (
    private repositoryWorkerMap: { [key: string]: RepositoryWorker } = {}
  ) {
  }

  clear () {
    for (let key in this.repositoryWorkerMap) {
      delete this.repositoryWorkerMap[key]
    }
  }

  queue (context: HandlerContext, pullRequestReference: PullRequestReference) {
    const queueName = getRepositoryKey(pullRequestReference)
    const repositoryWorker = this.repositoryWorkerMap[queueName] = this.repositoryWorkerMap[queueName] || new RepositoryWorker(pullRequestReference, context, handlePullRequest)
    context.log.debug('repositoryWorker')
    repositoryWorker.queue({
      type: 'handle',
      pullRequest: pullRequestReference.number
    })
  }
}

function getRepositoryKey ({ owner, repo }: RepositoryReference) {
  return `${owner}/${repo}`
}
