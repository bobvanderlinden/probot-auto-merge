import { AnyResponse } from '@octokit/rest'
import { PullRequestInfo } from './models'
import myappid from './myappid'

export function identity<T> (v: T): T { return v }
export function keysOf<TKey extends string> (obj: { [key in TKey]: any }): TKey[] {
  return Object.keys(obj) as TKey[]
}
export function groupBy<TItem> (
  keyFn: (item: TItem) => string,
  list: TItem[]
): { [key: string]: TItem[] } {
  return list.reduce((result: { [key: string]: TItem[] }, item: TItem) => {
    const key = keyFn(item)
    const previousValue = result[key] || []
    const newValue = [...previousValue, item]
    return {
      ...result,
      [key]: newValue
    }
  }, {})
}

export function groupByLast<TItem> (
  keyFn: (item: TItem) => string,
  list: TItem[]
): { [key: string]: TItem } {
  return groupByLastMap(keyFn, identity, list)
}

export function groupByLastMap<TItem, TKey extends string, TValue> (
  keyFn: (item: TItem) => TKey,
  valueFn: (item: TItem) => TValue,
  list: TItem[]
): { [key in TKey]: TValue } {
  return list.reduce((result, item) => ({
    ...result,
    [keyFn(item)]: valueFn(item)
  }), {} as any)
}

/**
 * Checks the supplied response for errors and casts response data to
 * supplied type.
 * @param response The response from a GitHub API
 */
export function result<TResult = void> (response: AnyResponse): TResult {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Response status was ${response.status}`)
  }
  return response.data
}

export function merge<A, B> (a: A, b: B): A & B {
  return Object.assign({}, a, b) as any
}

export function arrayToMap<TKey extends string, TValue, TItem> (
  arr: Array<TItem>,
  keyFn: (item: TItem) => TKey,
  valueFn: (item: TItem) => TValue
): { [key in TKey]?: TValue } {
  return arr.reduce((result: { [key in TKey]?: TValue }, item) => merge(result, {
    [keyFn(item)]: valueFn(item)
  }), {})
}

export function or<TValue> (optional: TValue | undefined, defaultValue: TValue): TValue {
  return optional === undefined
    ? defaultValue
    : optional
}

export function groupByCount<TKey extends string, TItem> (
  arr: Array<TItem>,
  keyFn: (item: TItem) => TKey
): { [key in TKey]?: number } {
  return arr.reduce((result: { [key in TKey]?: number }, item) => {
    const key = keyFn(item)
    const previousValue = result[key]
    const newValue = or<number>(previousValue, 0) + 1
    return merge(result, {
      [key]: newValue + 1
    })
  }, {})
}

export function mapToArray<TKey extends string, TValue> (map: { [key in TKey]?: TValue }): [TKey, TValue][] {
  return Object.entries(map) as any
}

export function get<TKey extends string, TValue> (obj: { [key in TKey]: TValue }, key: TKey): TValue {
  return obj[key]
}

export function tryGet<TKey extends string, TValue> (obj: { [key in TKey]?: TValue }, key: TKey): TValue | undefined {
  return obj[key]
}

export function getLatestReviews (pullRequestInfo: PullRequestInfo) {
  const sortedReviews = pullRequestInfo.reviews.nodes
    .filter(review => review.state !== 'COMMENTED')
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
  const latestReviewsByUser = groupByLast(
    review => review.author.login,
    sortedReviews
  )

  const latestReviews = Object.values(latestReviewsByUser)
  return latestReviews
}

export function mapObject<TKey extends string, TValue, TMappedValue> (obj: { [key in TKey]: TValue }, mapper: (value: TValue) => TMappedValue): { [key in TKey]: TMappedValue } {
  const result: any = {}
  for (const key in obj) {
    result[key] = mapper(obj[key])
  }
  return result
}

export function flatten<T> (arrays: T[][]): T[] { return ([] as T[]).concat.apply([], arrays) }

export function flatMap<TInput, TOutput> (array: Array<TInput>, fn: (input: TInput) => Array<TOutput>): Array<TOutput> {
  return array.reduce<Array<TOutput>>((result, input) => [...result, ...fn(input)], [])
}

export function getMyCheckSuite (pullRequestInfo: PullRequestInfo) {
  return pullRequestInfo.commits.nodes[0]
    .commit.checkSuites.nodes
    .filter(checkSuite => (checkSuite.app && checkSuite.app.databaseId) === myappid)[0]
}

export function getOtherCheckRuns (pullRequestInfo: PullRequestInfo) {
  return flatMap(pullRequestInfo.commits.nodes,
    commit => flatMap(commit.commit.checkSuites.nodes,
      checkSuite => checkSuite.checkRuns.nodes.map(
        checkRun => ({
          ...checkRun,
          checkSuite
        }))
    )
  ).filter(checkRun => (checkRun.checkSuite.app && checkRun.checkSuite.app.databaseId) !== myappid)
}
