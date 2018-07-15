import { AnyResponse } from "@octokit/rest";

export function identity<T>(v: T): T { return v; }

export function groupBy<TItem>(
  keyFn: (item: TItem) => string,
  list: TItem[]
): { [key: string]: TItem } {
  return groupByMap(keyFn, identity, list)
}

export function groupByMap<TItem, TValue>(
  keyFn: (item: TItem) => string,
  valueFn: (item: TItem) => TValue,
  list: TItem[]
): { [key: string]: TValue } {
  return list.reduce((result, item) => ({
    ...result,
    [keyFn(item)]: valueFn(item)
  }), {})
}

/**
 * Checks the supplied response for errors and casts response data to
 * supplied type.
 * @param response The response from a GitHub API
 */
export function result<TResult = void>(response: AnyResponse): TResult {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Response status was ${response.status}`);
  }
  return response.data;
}
