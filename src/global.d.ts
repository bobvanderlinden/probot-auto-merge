declare module 'probot-config' {
  export default function getConfig<TContext, TConfig> (context: TContext, fileName: String, defaultConfig: TConfig): Promise<TConfig>
}

declare module 'bunyan-sentry-stream' {
  export default function sentryStream (raven: any)
}
