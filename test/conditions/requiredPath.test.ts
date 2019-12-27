import requiredPath from '../../src/conditions/requiredPath'
import { createPullRequestInfo, createConditionConfig } from '../mock'

describe('requiredPath', () => {
  it('returns success with no configuration', async () => {
    const result = requiredPath(
      createConditionConfig(),
      createPullRequestInfo({
        files: {
          nodes: []
        }
      })
    )
    expect(result.status).toBe('success')
  })
  it('returns fail with path not in configuration', async () => {
    const result = requiredPath(
      createConditionConfig({
        requiredPathRegex: '^allowed_path/'
      }),
      createPullRequestInfo({
        files: {
          nodes: [{
            path: 'disallowed_path/file.txt'
          }]
        }
      })
    )
    expect(result.status).toBe('fail')
  })
  it('returns success with path in configuration', async () => {
    const result = requiredPath(
      createConditionConfig({
        requiredPathRegex: '^allowed_path/'
      }),
      createPullRequestInfo({
        files: {
          nodes: [{
            path: 'allowed_path/file.txt'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })
  it('returns success with multiple path in configuration', async () => {
    const result = requiredPath(
      createConditionConfig({
        requiredPathRegex: '^allowed_path/'
      }),
      createPullRequestInfo({
        files: {
          nodes: [{
            path: 'allowed_path/file.txt'
          }, {
            path: 'allowed_path/file2.txt'
          }]
        }
      })
    )
    expect(result.status).toBe('success')
  })
  it('returns fail with multiple path in and not in configuration', async () => {
    const result = requiredPath(
      createConditionConfig({
        requiredPathRegex: '^allowed_path/'
      }),
      createPullRequestInfo({
        files: {
          nodes: [{
            path: 'disallowed_path/file.txt'
          }, {
            path: 'allowed_path/file2.txt'
          }]
        }
      })
    )
    expect(result.status).toBe('fail')
  })
})
