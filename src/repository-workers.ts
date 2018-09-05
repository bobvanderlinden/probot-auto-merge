import { HandlerContext } from './models'
import { RepositoryReference, PullRequestReference } from './github-models'
import { RepositoryWorker } from './repository-worker'

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

  private createRepositoryWorker (repositoryReference: RepositoryReference, context: HandlerContext) {
    return new RepositoryWorker(
      repositoryReference,
      context,
      this.onRepositoryWorkerDrained.bind(this, repositoryReference)
    )
  }

  private onRepositoryWorkerDrained (repositoryReference: RepositoryReference) {
    const queueName = getRepositoryKey(repositoryReference)
    delete this.repositoryWorkerMap[queueName]
  }

  queue (context: HandlerContext, pullRequestReference: PullRequestReference) {
    const queueName = getRepositoryKey(pullRequestReference)
    const repositoryWorker = this.repositoryWorkerMap[queueName] = this.repositoryWorkerMap[queueName] || this.createRepositoryWorker(pullRequestReference, context)
    context.log.debug('repositoryWorker')
    repositoryWorker.queue(pullRequestReference.number)
  }
}

function getRepositoryKey ({ owner, repo }: RepositoryReference) {
  return `${owner}/${repo}`
}
