import { PullRequestStatus } from './../src/pull-request-status'
import { conditionNames } from './../src/conditions/index'
import { conditions, ConditionName } from './../src/conditions/'
import { ConditionResult } from './../src/condition'
import { PullRequestInfo } from './../src/models'
import { getPullRequestPlan, executeAction } from '../src/pull-request-handler'
import { createHandlerContext, createPullRequestInfo, createConfig, defaultPullRequestInfo, createGithubApi, createPullRequestContext, createOkResponse, createRef } from './mock'
import { mapObject } from '../src/utils'
import { MergeStateStatus, PullRequestState } from '../src/query.graphql'

const defaultBaseRef: PullRequestInfo['baseRef'] = {
  repository: {
    owner: {
      login: 'bobvanderlinden'
    },
    name: 'probot-auto-merge'
  },
  name: 'master',
  target: {
    oid: '0000000000000000000000000000000000000000'
  }
}

const successPullRequestStatus: { [key in ConditionName]: ConditionResult } = mapObject(conditions, (_) => ({
  status: 'success'
} as ConditionResult))

function createPullRequestStatus (conditionResults?: Partial<typeof successPullRequestStatus>): PullRequestStatus {
  return {
    ...successPullRequestStatus,
    ...conditionResults
  }
}

const headRefInSameRepository: PullRequestInfo['headRef'] = {
  ...defaultBaseRef,
  name: 'pr-some-changes',
  target: {
    oid: '1111111111111111111111111111111111111111'
  }
}

describe('getPullRequestPlan', () => {
  it('merges when status is ready_for_merge', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext(),
      createPullRequestInfo(),
      createPullRequestStatus()
    )
    expect(plan.actions).toEqual(['merge'])
  })

  test.each(conditionNames)('does not merge when condition %s fails', async (conditionName) => {
    const plan = getPullRequestPlan(
      createHandlerContext(),
      createPullRequestInfo(),
      createPullRequestStatus({
        [conditionName]: {
          status: 'fail',
          message: ''
        }
      })
    )
    expect(plan.actions).toEqual([])
  })

  it('does not reschedule when mergeable is pending but the pull request was merged or closed', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext(),
      createPullRequestInfo(),
      createPullRequestStatus({
        open: {
          status: 'fail',
          message: ''
        },
        mergeable: {
          status: 'pending'
        }
      })
    )
    expect(plan.actions).toEqual([])
  })

  it('does not reschedule when mergeable is pending but the pull request was merged', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext(),
      createPullRequestInfo({
        state: PullRequestState.MERGED
      }),
      createPullRequestStatus({
        mergeable: {
          status: 'pending'
        }
      })
    )
    expect(plan.actions).toEqual([])
  })

  it('does not reschedule when mergeable is pending but the pull request was closed', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext(),
      createPullRequestInfo({
        state: PullRequestState.CLOSED
      }),
      createPullRequestStatus({
        mergeable: {
          status: 'pending'
        }
      })
    )
    expect(plan.actions).toEqual([])
  })

  it('schedules next run when one of the conditions is pending', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext(),
      createPullRequestInfo(),
      createPullRequestStatus({
        blockingChecks: {
          status: 'pending'
        }
      })
    )
    expect(plan.actions).toEqual(['reschedule'])
  })

  it('update branch when pull request is out-of-date and update-branch is enabled', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext({
        config: createConfig({
          updateBranch: true
        })
      }),
      createPullRequestInfo({
        baseRef: defaultBaseRef,
        headRef: headRefInSameRepository,
        baseRefOid: '2',
        mergeStateStatus: MergeStateStatus.BEHIND,
        repository: {
          branchProtectionRules: {
            nodes: [{
              pattern: 'master',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: []
            }]
          }
        }
      }),
      createPullRequestStatus()
    )
    expect(plan.actions).toEqual(['update_branch', 'reschedule'])
  })

  it('emit error when pull request merge status is BLOCKED', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext({
        config: createConfig()
      }),
      createPullRequestInfo({
        baseRef: createRef({
          name: 'main'
        }),
        headRef: headRefInSameRepository,
        mergeStateStatus: MergeStateStatus.BLOCKED
      }),
      createPullRequestStatus()
    )
    expect(plan).toEqual({
      code: 'blocked',
      actions: [],
      message: 'Merging the pull request is blocked by branch protection rules. Please make sure probot-auto-merge has permission to push to `main` under the "Restrict who can push to matching branches" section the branch protection rules.'
    })
  })

  it('not update branch when pull request is up-to-date and update-branch is disabled', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext({
        config: createConfig({
          updateBranch: false
        })
      }),
      createPullRequestInfo({
        baseRef: defaultBaseRef,
        headRef: {
          name: 'pr-my-branch',
          repository: defaultBaseRef.repository,
          target: {
            oid: '2'
          }
        },
        baseRefOid: '3',
        repository: {
          branchProtectionRules: {
            nodes: [{
              pattern: 'master',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: []
            }]
          }
        }
      }),
      createPullRequestStatus()
    )
    expect(plan.actions).toEqual(['merge'])
  })

  it('not update branch when pull request is is based in fork', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext({
        config: createConfig({
          updateBranch: true
        })
      }),
      createPullRequestInfo({
        baseRef: defaultBaseRef,
        headRef: {
          name: 'pr-my-branch',
          repository: {
            ...defaultBaseRef.repository,
            owner: {
              login: 'some-contributor'
            }
          },
          target: {
            oid: '2'
          }
        },
        baseRefOid: '3',
        mergeStateStatus: MergeStateStatus.BEHIND,
        repository: {
          branchProtectionRules: {
            nodes: [{
              pattern: 'master',
              restrictsPushes: true,
              requiresStrictStatusChecks: true,
              requiredStatusCheckContexts: []
            }]
          }
        }
      }),
      createPullRequestStatus()
    )
    expect(plan.actions).toEqual([])
  })

  it('delete branch when status is ready_for_merge and delete-branch-after-merge is enabled and branch resides in same repository', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext({
        config: createConfig({
          deleteBranchAfterMerge: true
        })
      }),
      createPullRequestInfo(),
      createPullRequestStatus()
    )

    expect(plan.actions).toEqual(['merge', 'delete_branch'])
  })
  it('do not delete branch when status is ready_for_merge and delete-branch-after-merge is enabled, but branch resides in another repository', async () => {
    const plan = getPullRequestPlan(
      createHandlerContext({
        config: createConfig({
          deleteBranchAfterMerge: true
        })
      }),
      createPullRequestInfo({
        baseRef: {
          ...defaultPullRequestInfo.baseRef,
          name: 'master',
          repository: {
            owner: {
              login: 'bobvanderlinden'
            },
            name: 'probot-auto-merge'
          }
        },
        headRef: defaultPullRequestInfo.headRef && {
          ...defaultPullRequestInfo.headRef,
          name: 'pr',
          repository: {
            owner: {
              login: 'someone-else'
            },
            name: 'probot-auto-merge'
          }
        }
      }),
      createPullRequestStatus()
    )
    expect(plan.actions).toEqual(['merge'])
  })
})

describe('executeAction with action', () => {
  it('merge', async () => {
    const merge = createOkResponse()
    await executeAction(
      createPullRequestContext({
        github: createGithubApi({
          pulls: {
            merge
          }
        })
      }),
      createPullRequestInfo({
        baseRef: {
          name: 'master',
          target: {
            oid: '0'
          },
          repository: {
            name: 'probot-auto-merge',
            owner: {
              login: 'bobvanderlinden'
            }
          }
        },
        number: 2
      }),
      'merge'
    )

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge).toBeCalledWith({
      merge_method: 'merge',
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      pull_number: 2
    })
  })

  it('merge with commit message', async () => {
    const merge = createOkResponse()
    await executeAction(
      createPullRequestContext({
        github: createGithubApi({
          pulls: {
            merge
          }
        }),
        config: createConfig({
          mergeCommitMessage: '{title} (#{number})\n{body}'
        })
      }),
      createPullRequestInfo({
        baseRef: {
          name: 'master',
          target: {
            oid: '0'
          },
          repository: {
            name: 'probot-auto-merge',
            owner: {
              login: 'bobvanderlinden'
            }
          }
        },
        number: 2,
        title: 'pr title',
        body: 'pr body'
      }),
      'merge'
    )

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge).toBeCalledWith({
      merge_method: 'merge',
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      pull_number: 2,
      commit_message: 'pr body',
      commit_title: 'pr title (#2)'
    })
  })

  it('delete_branch', async () => {
    const deleteRef = createOkResponse()
    await executeAction(
      createPullRequestContext({
        github: createGithubApi({
          git: {
            deleteRef
          }
        })
      }),
      createPullRequestInfo({
        headRef: {
          name: 'the-merged-branch',
          target: {
            oid: '0'
          },
          repository: {
            owner: {
              login: 'bobvanderlinden'
            },
            name: 'probot-auto-merge'
          }
        }
      }),
      'delete_branch'
    )

    expect(deleteRef).toHaveBeenCalledTimes(1)
    expect(deleteRef).toBeCalledWith({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      ref: 'heads/the-merged-branch'
    })
  })

  it('update_branch', async () => {
    const merge = createOkResponse()
    await executeAction(
      createPullRequestContext({
        github: createGithubApi({
          repos: {
            merge
          }
        })
      }),
      createPullRequestInfo({
        headRefOid: '0',
        headRef: {
          name: 'the-pr-branch',
          target: {
            oid: '0'
          },
          repository: {
            owner: {
              login: 'bobvanderlinden'
            },
            name: 'probot-auto-merge'
          }
        },
        baseRefOid: '1',
        baseRef: {
          name: 'master',
          target: {
            oid: '2'
          },
          repository: {
            owner: {
              login: 'bobvanderlinden'
            },
            name: 'probot-auto-merge'
          }
        }
      }),
      'update_branch'
    )

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge).toBeCalledWith({
      owner: 'bobvanderlinden',
      repo: 'probot-auto-merge',
      base: 'the-pr-branch',
      head: 'master'
    })
  })

  it('reschedule', async () => {
    const reschedulePullRequest = jest.fn(() => undefined)
    await executeAction(
      createPullRequestContext({
        reschedulePullRequest
      }),
      createPullRequestInfo(),
      'reschedule'
    )
    expect(reschedulePullRequest).toHaveBeenCalledTimes(1)
  })
})
