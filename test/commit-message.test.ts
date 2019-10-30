import { splitCommitMessage, getCommitMessage } from '../src/commit-message'
import { createPullRequestInfo, createConfig } from './mock'

describe('splitCommitMessage', () => {
  it('returns title', () => {
    expect(splitCommitMessage('pro')).toEqual({ title: 'pro', body: '' })
    expect(splitCommitMessage('\npro')).toEqual({ title: 'pro', body: '' })
    expect(splitCommitMessage('\n\n\npro')).toEqual({ title: 'pro', body: '' })
    expect(splitCommitMessage('pro\n')).toEqual({ title: 'pro', body: '' })
    expect(splitCommitMessage('pro\n\n\n')).toEqual({ title: 'pro', body: '' })
  })

  it('returns title and body', () => {
    expect(splitCommitMessage('pro\nbot')).toEqual({ title: 'pro', body: 'bot' })
    expect(splitCommitMessage('pro\n\n\nbot')).toEqual({ title: 'pro', body: 'bot' })
    expect(splitCommitMessage('\n\npro\n\nbot\n\n')).toEqual({ title: 'pro', body: 'bot' })
    expect(splitCommitMessage('\n\npro\n\nbot\nauto\n\nmerge\n\n')).toEqual({ title: 'pro', body: 'bot\nauto\n\nmerge' })
  })
})

describe('getCommitMessage', () => {
  it('returns null if not configured', () => {
    const pullRequestInfo = createPullRequestInfo()
    const config = createConfig()
    expect(getCommitMessage(pullRequestInfo, config)).toEqual(null)
  })

  it('returns literal configuration value', () => {
    const pullRequestInfo = createPullRequestInfo()
    const config = createConfig({
      mergeCommitMessage: 'fixed commit message'
    })
    expect(getCommitMessage(pullRequestInfo, config)).toEqual('fixed commit message')
  })

  it('returns resolved title tag', () => {
    const pullRequestInfo = createPullRequestInfo({
      title: 'pr title'
    })
    const config = createConfig({
      mergeCommitMessage: '{title}'
    })
    expect(getCommitMessage(pullRequestInfo, config)).toEqual('pr title')
  })

  it('returns resolved body tag', () => {
    const pullRequestInfo = createPullRequestInfo({
      body: 'pr body'
    })
    const config = createConfig({
      mergeCommitMessage: '{body}'
    })
    expect(getCommitMessage(pullRequestInfo, config)).toEqual('pr body')
  })

  it('returns resolved number tag', () => {
    const pullRequestInfo = createPullRequestInfo({
      number: 7
    })
    const config = createConfig({
      mergeCommitMessage: '{number}'
    })
    expect(getCommitMessage(pullRequestInfo, config)).toEqual('7')
  })

  it('returns resolved branch tag', () => {
    const pullRequestInfo = createPullRequestInfo({
      headRefName: 'pr-branch'
    })
    const config = createConfig({
      mergeCommitMessage: '{branch}'
    })
    expect(getCommitMessage(pullRequestInfo, config)).toEqual('pr-branch')
  })

  it('returns resolved commits tag', () => {
    const pullRequestInfo = createPullRequestInfo({
      allCommits: {
        nodes: [{
          commit: {
            abbreviatedOid: '1111111',
            messageHeadline: 'commit-1'
          }
        }, {
          commit: {
            abbreviatedOid: '2222222',
            messageHeadline: 'commit-2'
          }
        }]
      }
    })
    const config = createConfig({
      mergeCommitMessage: '{commits}'
    })
    expect(getCommitMessage(pullRequestInfo, config)).toEqual('* commit-1 (1111111)\n* commit-2 (2222222)')
  })

  it('returns multiple template tags', () => {
    const pullRequestInfo = createPullRequestInfo({
      title: 'pr-title',
      body: 'pr-body'
    })
    const config = createConfig({
      mergeCommitMessage: '{title}{body}'
    })
    expect(getCommitMessage(pullRequestInfo, config)).toEqual('pr-titlepr-body')
  })

  it('returns combination of literal configuration value and template tag', () => {
    const pullRequestInfo = createPullRequestInfo({
      title: 'pr title'
    })
    const config = createConfig({
      mergeCommitMessage: 'merged: {title}'
    })
    expect(getCommitMessage(pullRequestInfo, config)).toEqual('merged: pr title')
  })

  it(`doesn't replace template tag recursively`, () => {
    const pullRequestInfo = createPullRequestInfo({
      title: 'pr title containing template tag {body}',
      body: 'pr body'
    })
    const config = createConfig({
      mergeCommitMessage: '{title}'
    })
    expect(getCommitMessage(pullRequestInfo, config)).toEqual('pr title containing template tag {body}')
  })
})
