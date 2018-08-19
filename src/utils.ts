import { AnyResponse } from '@octokit/rest'
import { PullRequestInfo } from './models'

export type DeepPartial<T> = { [Key in keyof T]?: DeepPartial<T[Key]>; }
export type ElementOf<TArray> = TArray extends Array<infer TElement> ? TElement : never

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

export function mapToArray<TKey extends string, TValue> (map: { [key in TKey]?: TValue }) {
  return Object.entries(map)
}

export function get<TKey extends string, TValue> (obj: { [key in TKey]: TValue }, key: TKey): TValue {
  return obj[key]
}

export function getLatestReviews (pullRequestInfo: PullRequestInfo) {
  const sortedReviews = pullRequestInfo.reviews.nodes.sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  )
  const latestReviewsByUser = groupByLast(
    review => review.author.login,
    sortedReviews
  )

  const latestReviews = Object.values(latestReviewsByUser)
  return latestReviews
}

export function mapObject<TKey extends string, TValue, TMappedValue> (obj: { [key in TKey]: TValue }, mapper: (value: TValue) => TMappedValue): { [key in TKey]: TMappedValue } {
  const result: any = {}
  for (let key in obj) {
    result[key] = mapper(obj[key])
  }
  return result
}
