import { WorkerContext } from './models'
import { RepositoryReference, PullRequestReference } from './github-models'
import { RepositoryWorker } from './repository-worker'

type RepositoryWorkerMap = { [key: string]: RepositoryWorker }
export class RepositoryWorkers {
  constructor (
    private onPullRequestError: (pullRequest: PullRequestReference, error: any) => void,
    private repositoryWorkerMap: RepositoryWorkerMap = {}
  ) {
  }

  clear () {
    for (let key in this.repositoryWorkerMap) {
      delete this.repositoryWorkerMap[key]
    }
  }

  private createRepositoryWorker (repositoryReference: RepositoryReference, context: WorkerContext) {
    const createGitHubAPI = context.createGitHubAPI
    const log = context.log
    const config = context.config
    const workerContext: WorkerContext = {
      createGitHubAPI,
      log,
      config
    }
    return new RepositoryWorker(
      repositoryReference,
      workerContext,
      this.onRepositoryWorkerDrained.bind(this, repositoryReference),
      this.onPullRequestError
    )
  }

  private onRepositoryWorkerDrained (repositoryReference: RepositoryReference) {
    const queueName = getRepositoryKey(repositoryReference)
    delete this.repositoryWorkerMap[queueName]
  }

  queue (context: WorkerContext, pullRequestReference: PullRequestReference) {
    const queueName = getRepositoryKey(pullRequestReference)
    const repositoryWorker = this.repositoryWorkerMap[queueName] = this.repositoryWorkerMap[queueName] || this.createRepositoryWorker(pullRequestReference, context)
    repositoryWorker.queue(pullRequestReference.number)
  }

  public getRepositoryWorkers (): Readonly<RepositoryWorkerMap> {
    return this.repositoryWorkerMap
  }
}

function getRepositoryKey ({ owner, repo }: RepositoryReference) {
  return `${owner}/${repo}`
}
