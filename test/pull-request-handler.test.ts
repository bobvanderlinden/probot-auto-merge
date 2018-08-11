import { PullRequestInfo } from './../src/pull-request-query';
import { handlePullRequestStatus } from "../src/pull-request-handler";
import { PullRequestStatusCodes } from "../src/pull-request-status";
import { mockPullRequestContext, githubCallMock, createHandlerContext, createPullRequestInfo, createGithubApi, createConfig, defaultPullRequestInfo } from "./mock";
import { create } from "domain";

const defaultBaseRef: PullRequestInfo["baseRef"] = {
  repository: {
    owner: {
      login: "bobvanderlinden"
    },
    name: "probot-auto-merge"
  },
  name: "master",
  target: {
    oid: "0000000000000000000000000000000000000000"
  }
}

const headRefInSameRepository: PullRequestInfo["headRef"] = {
  ...defaultBaseRef,
  name: "pr-some-changes",
  target: {
    oid: "1111111111111111111111111111111111111111"
  }
}

const headRefInFork: PullRequestInfo["headRef"] = {
  ...headRefInSameRepository,
  repository: {
    ...headRefInSameRepository.repository,
    owner: {
      login: "someone-else"
    }
  }
}

describe("handlePullRequestStatus", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
  });
  it("merges when status is ready_for_merge", async () => {
    const merge = jest.fn(() => ({ status: 200 }))
    await handlePullRequestStatus(
      createHandlerContext({
        github: createGithubApi({
          pullRequests: {
            merge
          }
        })
      }),
      createPullRequestInfo(), {
        code: "ready_for_merge",
        message: "bogus"
      }
    );
    expect(merge).toHaveBeenCalledTimes(1);
  });
  it("does not merge on status other than ready_for_merge", async () => {
    const merge = jest.fn(() => ({ status: 200 }))
    for (let code of PullRequestStatusCodes.filter(
      code => code !== "ready_for_merge" && code !== "out_of_date_branch"
    )) {
      await handlePullRequestStatus(
        createHandlerContext({
          github: createGithubApi({
            pullRequests: {
              merge
            }
          })
        }),
        createPullRequestInfo(), {
          code,
          message: "bogus"
        } as any
      );
    }
    expect(merge).toHaveBeenCalledTimes(0);
  });
  it("schedules next run when status is pending_checks", async () => {
    await handlePullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo(), {
      code: "pending_checks",
      message: "bogus"
    });
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });
  it("does not merge on status other than pending_checks", async () => {
    const merge = jest.fn(() => ({ status: 200 }))
    for (let code of PullRequestStatusCodes.filter(
      code => code !== "pending_checks" && code !== "out_of_date_branch"
    )) {
      await handlePullRequestStatus(
        createHandlerContext({
          github: createGithubApi({
            pullRequests: {
              merge
            }
          })
        }),
        createPullRequestInfo(), {
        code,
        message: "bogus"
      } as any);
    }
    expect(setTimeout).toHaveBeenCalledTimes(0);
  });
  it("update branch when status is out_of_date_branch", async () => {
    const merge = jest.fn(() => ({ status: 200 }));
    await handlePullRequestStatus(
      createHandlerContext({
        github: createGithubApi({
          repos: {
            merge
          }
        }),
        config: createConfig({
          updateBranch: true
        })
      }),
      createPullRequestInfo({

      }), {
        code: "out_of_date_branch",
        message: "bogus"
      });
    expect(merge).toHaveBeenCalledTimes(1);
    expect(merge.mock.calls[0]).toEqual([{
      base: "pr-some-change",
      head: "master",
      owner: "bobvanderlinden",
      repo: "probot-auto-merge"
    }]);
  });
  it("update branch when status is out_of_date_branch and update-branch is enabled", async () => {
    const merge = jest.fn(() => ({ status: 200 }));
    await handlePullRequestStatus(
      createHandlerContext({
        github: createGithubApi({
          repos: {
            merge
          }
        }),
        config: createConfig({
          updateBranch: true
        })
      }),
      createPullRequestInfo({
        baseRef: defaultBaseRef,
        headRef: headRefInSameRepository
      }), {
      code: "out_of_date_branch",
      message: "bogus"
    });
    expect(merge).toHaveBeenCalledTimes(1);
    expect(merge.mock.calls[0]).toEqual([{
      base: "pr-some-changes",
      head: "master",
      owner: "bobvanderlinden",
      repo: "probot-auto-merge"
    }]);
  });
  it("not update branch when status is out_of_date_branch and update-branch is disabled", async () => {
    const merge = jest.fn(() => ({ status: 200 }));
    await handlePullRequestStatus(
      createHandlerContext({
        github: createGithubApi({
          repos: {
            merge
          }
        }),
        config: createConfig({
          updateBranch: false
        })
      }),
      createPullRequestInfo({
        baseRef: defaultBaseRef,
        headRef: headRefInSameRepository
      }), {
      code: "out_of_date_branch",
      message: "bogus"
    });
    expect(merge).toHaveBeenCalledTimes(0);
  });
  it("delete branch when status is ready_for_merge and delete-branch-after-merge is enabled and branch resides in same repository", async () => {
    const merge = jest.fn(() => ({ status: 200 }));
    const deleteReference = jest.fn(() => ({ status: 200 }));
    await handlePullRequestStatus(
      createHandlerContext({
        github: createGithubApi({
          pullRequests: {
            merge
          },
          gitdata: {
            deleteReference
          }
        }),
        config: createConfig({
          deleteBranchAfterMerge: true
        })
      }),
      createPullRequestInfo({
        baseRef: defaultBaseRef,
        headRef: headRefInSameRepository
      }), {
        code: "ready_for_merge",
        message: "bogus"
      }
    );
    expect(deleteReference).toHaveBeenCalledTimes(1);
    expect(deleteReference.mock.calls[0]).toEqual([
      { owner: "bobvanderlinden", ref: "heads/pr-some-changes", repo: "probot-auto-merge" }
    ]);
  });
  it("do not delete branch when status is ready_for_merge and delete-branch-after-merge is enabled, but branch resides in another repository", async () => {
    const merge = jest.fn(() => ({ status: 200 }));
    const deleteReference = jest.fn(() => ({ status: 200 }));
    await handlePullRequestStatus(
      createHandlerContext({
        github: createGithubApi({
          pullRequests: {
            merge
          },
          gitdata: {
            deleteReference
          }
        }),
        config: createConfig({
          deleteBranchAfterMerge: true
        })
      }),
      createPullRequestInfo({
        baseRef: {
          ...defaultPullRequestInfo.baseRef,
          name: "master",
          repository: {
            owner: {
              login: "bobvanderlinden"
            },
            name: "probot-auto-merge"
          }
        },
        headRef: {
          ...defaultPullRequestInfo.headRef,
          name: "pr",
          repository: {
            owner: {
              login: "someone-else"
            },
            name: "probot-auto-merge"
          }
        }
      }), {
        code: "ready_for_merge",
        message: "bogus"
      }
    );
    expect(deleteReference).toHaveBeenCalledTimes(0);
  });
});
