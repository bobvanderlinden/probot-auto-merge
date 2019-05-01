import Raven from 'raven'

Raven.config('https://123@sentry.io/123').install()

process.on('unhandledRejection', reason => {
  throw reason
})
