export type Primitive = null | undefined | boolean | string | number | Function

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type DeepPartial<T> = { [Key in keyof T]?: DeepPartial<T[Key]>; }
export type ElementOf<TArray> = TArray extends Array<infer TElement> ? TElement : never

export type AnyFunction = (...args: any[]) => any
export type ReturnType<T extends AnyFunction> = T extends (...args: any[]) => infer R ? R : any

export type Diff<T, U> = T extends U ? never : T
export type NonNullable<T> = Diff<T, null | undefined>

export type Convert<T, TMatch, TConvert> = T extends TMatch ? TConvert : T
export type DeepConvert<T, TMatch, TConvert> = T extends TMatch
  ? TConvert
  : T extends Primitive
  ? T
  : T extends Array<infer TItem>
  ? DeepConvertFromArray<TItem, TMatch, TConvert>
  : T extends { [key: string]: any }
  ? DeepConvertFromObject<T, TMatch, TConvert>
  : never
export interface DeepConvertFromArray<T, TMatch, TConvert> extends Array<DeepConvert<T, TMatch, TConvert>> { }
export type DeepConvertFromObject<T, TMatch, TConvert> = {
  [TKey in keyof T]: DeepConvert<T[TKey], TMatch, TConvert>;
}

export type ReplaceFields<T, TKey extends keyof T, TReplacementType extends { [Key in TKey]: any }> = Omit<T, TKey> & TReplacementType
