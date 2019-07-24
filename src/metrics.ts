import promClient, { Gauge, labelValues } from 'prom-client'

const makeMockGauge = (name: String): Partial<Gauge> => ({
  set: (labels: labelValues | number, value: number) => {} // tslint:disable-line:no-empty
})

class MetricsReporter {
  public rateLimitGauge: Gauge
  public queueSizeGauge: Gauge

  constructor (public enabled: boolean) {
    this.enabled = enabled

    if (this.enabled) {
      promClient.collectDefaultMetrics()

      this.rateLimitGauge = new promClient.Gauge({
        name: 'probot_auto_merge_github_rate_limit_remaining',
        help:
          'Github rate limit as reported by the `x-ratelimit-remaining` header',
        labelNames: ['owner', 'repo', 'apiVersion']
      })

      this.queueSizeGauge = new promClient.Gauge({
        name: 'probot_auto_merge_pr_queue_size',
        help: 'Number of PRs in the Probot Auto Merge queue',
        labelNames: ['owner', 'repo']
      })
    } else {
      this.rateLimitGauge = makeMockGauge('rate limit') as Gauge
      this.queueSizeGauge = makeMockGauge('queue size') as Gauge
    }
  }

  outputMetrics (): string {
    return this.enabled ? promClient.register.metrics() : 'nothing'
  }
}

const metricsReporter = new MetricsReporter(
  process.env.NODE_ENV === 'production'
)

export { metricsReporter }
