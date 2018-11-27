export type Primitive = null | undefined | boolean | string | number | Function

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type DeepPartial<T> = { [Key in keyof T]?: DeepPartial<T[Key]>; }
export type ElementOf<TArray> = TArray extends Array<infer TElement> ? TElement : never

export type AnyFunction = (...args: any[]) => any
export type ReturnType<T extends AnyFunction> = T extends (...args: any[]) => infer R ? R : any

export type Diff<T, U> = T extends U ? never : T
export type NonNullable<T> = Diff<T, null | undefined>
