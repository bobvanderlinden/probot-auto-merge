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
