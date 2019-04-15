import { Context } from 'probot'
import { RepositoryReference, PullRequestInfo, QueryResult } from './github-models'
import { query } from './query'
import { getConfigFromUserConfig, Config } from './config'
import yaml from 'js-yaml'
import { validatePullRequest } from './query-validator'
import { getPullRequestPlan, PullRequestPlan } from './pull-request-handler'
import { getPullRequestStatus } from './pull-request-status'
import { conditions } from './conditions'
import { intersection } from './utils'

export type RepositoryHandlerContext = {
  log: Context['log'],
  github: Context['github'],
  repository: RepositoryReference
}

export type PullRequestContextData = {
  config: Config,
  pullRequestInfo: PullRequestInfo
}

export type Mutations = {
  [key: string]: string
}

export type PullRequestPlanAndInfo = {
  plan: PullRequestPlan,
  pullRequestInfo: PullRequestInfo
}

function parseConfig (configText: string) {
  const userConfig = yaml.safeLoad(configText)
  return getConfigFromUserConfig(userConfig)
}

export async function handleRepository (context: RepositoryHandlerContext): Promise<Mutations> {
  const queryResult = await query(context.github, context.repository)
  return getMutations(queryResult)
}

export function getMutations (queryResult: QueryResult): { [key: string]: string } {
  const repository = queryResult.repository
  const config = parseConfig(repository.configFile.text)

  const results = repository.pullRequests.nodes
    .map(node => validatePullRequest(node))
    .map(pullRequest => ({ ...pullRequest, repository }))
    .map(pullRequestInfo => ({
      plan: getPullRequestPlanFromQueryResult({
        config,
        pullRequestInfo
      }),
      pullRequestInfo
    }))

  const ready = results
    .filter(a => a.plan.code === 'merge' || a.plan.code === 'merge_and_delete')[0]

  const upToDate = results.map(result => {
    const potentialMergeCommit = result.pullRequestInfo.potentialMergeCommit
    if (potentialMergeCommit === null) {
      return null
    } else {
      const parentOids = potentialMergeCommit.parents.nodes.map(parent => parent.oid)
      const baseRefOid = result.pullRequestInfo.baseRef.target.oid
      const isUpToDateMergeCommit = parentOids.includes(baseRefOid)
      if (isUpToDateMergeCommit) {
        return result
      } else {
        return null
      }
    }
  }).filter(result => result)

  const pending = results.filter(a => a.plan.code === 'pending_condition')

  const pendingAndUpToDate = intersection(upToDate, pending)

  const outOfDate = results.filter(a => a.plan.code === 'update_branch')[0]

  console.log('results', results)
  console.log('ready', ready)
  console.log('pending', pending)
  console.log('pendingAndUpToDate', pendingAndUpToDate)
  console.log('outOfDate', outOfDate)

  let mutations: { [key: string]: string } = {}
  if (ready) {
    mutations = { ...mutations, ...createMergeMutations(ready) }
  } else if (pendingAndUpToDate.length > 0) {
    // Wait for the pending pull requests to finish
  } else if (outOfDate) {
    mutations = { ...mutations, ...createUpdateMutations(outOfDate) }
  }

  return mutations
}

function createMergeMutations (pullRequestResult: PullRequestPlanAndInfo) {
  return {
    merge: `${pullRequestResult.pullRequestInfo.number}`
  }
}

function createUpdateMutations (pullRequestResult: PullRequestPlanAndInfo) {
  return {
    update: `${pullRequestResult.pullRequestInfo.number}`
  }
}

function getPullRequestPlanFromQueryResult (data: PullRequestContextData) {
  const status = getPullRequestStatus(
    { config: data.config },
    conditions,
    data.pullRequestInfo
  )
  return getPullRequestPlan(
    { config: data.config },
    data.pullRequestInfo,
    status
  )
}
