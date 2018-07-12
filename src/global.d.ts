declare function setTimeout(fn: Function, millis: number): number

declare module "probot-config" {
  export function getConfig<TContext, TConfig>(context: TContext, fileName: String, defaultConfig: TConfig): TConfig
}
