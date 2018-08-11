declare module "probot-config" {
  export default function getConfig<TContext, TConfig>(context: TContext, fileName: String, defaultConfig: TConfig): Promise<TConfig>
}
