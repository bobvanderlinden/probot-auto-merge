import { createConditionConfig, createPullRequestInfo } from '../mock'

import blockingBody from '../../src/conditions/blockingBody'

describe('blockingBody', () => {
  it('returns success with empty body and no configuration', async () => {
    const result = blockingBody(
      createConditionConfig(),
      createPullRequestInfo({
        body: ''
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns success with regular expression not matching body', async () => {
    const result = blockingBody(
      createConditionConfig({
        blockingBodyRegex: 'blocked-body'
      }),
      createPullRequestInfo({
        body: 'unrelated'
      })
    )
    expect(result.status).toBe('success')
  })

  it('returns fail with regular expression matching body', async () => {
    const result = blockingBody(
      createConditionConfig({
        blockingBodyRegex: 'blocked-body'
      }),
      createPullRequestInfo({
        body: 'A short test with blocked-body included'
      })
    )
    expect(result.status).toBe('fail')
  })

  it('returns fail with longer body matching regular expression', async () => {
    const result = blockingBody(
      createConditionConfig({
        blockingBodyRegex: 'blocked-body'
      }),
      createPullRequestInfo({
        body: `This is a long multi-line pull request description

labels: blocked-body`
      })
    )
    expect(result.status).toBe('fail')
  })
  it('returns fail with longer body with more complicated matching regular expression', async () => {
    const result = blockingBody(
      createConditionConfig({
        blockingBodyRegex: '\\w+:\\s`blocked-body`$'
      }),
      createPullRequestInfo({
        body: `This is a long multi-line pull request description
that includes \`escaped-characters\`
with multiline codeblock:
\`\`\`
  echo "hello"
\`\`\`
labels: \`blocked-body\``
      })
    )
    expect(result.status).toBe('fail')
  })
})
