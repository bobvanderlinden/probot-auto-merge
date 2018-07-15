import { handlePullRequestStatus } from "../src/pull-request-handler";
import { PullRequestStatusCodes } from "../src/pull-request-status";
import { mockPullRequestContext, githubCallMock } from "./mock";

describe("handlePullRequestStatus", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
  });
  it("merges when status is ready_for_merge", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext();
    await handlePullRequestStatus(context, pullRequestInfo, {
      code: "ready_for_merge",
      message: "bogus"
    });
    expect(merge).toHaveBeenCalledTimes(1);
  });
  it("does not merge on status other than ready_for_merge", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext();
    for (let code of PullRequestStatusCodes.filter(
      code => code !== "ready_for_merge" && code !== "out_of_date_branch"
    )) {
      await handlePullRequestStatus(context, pullRequestInfo, {
        code,
        message: "bogus"
      } as any);
    }
    expect(merge).toHaveBeenCalledTimes(0);
  });
  it("schedules next run when status is pending_checks", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext();
    await handlePullRequestStatus(context, pullRequestInfo, {
      code: "pending_checks",
      message: "bogus"
    });
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });
  it("does not merge on status other than pending_checks", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext();
    for (let code of PullRequestStatusCodes.filter(
      code => code !== "pending_checks" && code !== "out_of_date_branch"
    )) {
      await handlePullRequestStatus(context, pullRequestInfo, {
        code,
        message: "bogus"
      } as any);
    }
    expect(setTimeout).toHaveBeenCalledTimes(0);
  });
  it("update branch when status is out_of_date_branch", async () => {
    const merge = githubCallMock(null);
    const { context, pullRequestInfo } = mockPullRequestContext({
      config: {
        "update-branch": true
      },
      githubRepoMerge: merge
    });
    await handlePullRequestStatus(context, pullRequestInfo, {
      code: "out_of_date_branch",
      message: "bogus",
      merge: {
        base: "mybranch",
        head: "master",
        owner: "john",
        repo: "test"
      }
    });
    expect(merge).toHaveBeenCalledTimes(1);
    expect(merge.mock.calls[0]).toEqual([
      {
        base: "mybranch",
        head: "master",
        owner: "john",
        repo: "test"
      }
    ]);
  });
  it("update branch when status is out_of_date_branch and update-branch is enabled", async () => {
    const mergeParameters = {
      base: "mybranch",
      head: "master",
      owner: "john",
      repo: "test"
    };
    const merge = githubCallMock(null);
    const { context, pullRequestInfo } = mockPullRequestContext({
      config: {
        "update-branch": true
      },
      githubRepoMerge: merge
    });
    await handlePullRequestStatus(context, pullRequestInfo, {
      code: "out_of_date_branch",
      message: "bogus",
      merge: mergeParameters
    });
    expect(merge).toHaveBeenCalledTimes(1);
    expect(merge.mock.calls[0]).toEqual([mergeParameters]);
  });
  it("not update branch when status is out_of_date_branch and update-branch is disabled", async () => {
    const mergeParameters = {
      base: "mybranch",
      head: "master",
      owner: "john",
      repo: "test"
    };
    const merge = githubCallMock(null);
    const { context, pullRequestInfo } = mockPullRequestContext({
      config: {
        "update-branch": false
      },
      githubRepoMerge: merge
    });
    await handlePullRequestStatus(context, pullRequestInfo, {
      code: "out_of_date_branch",
      message: "bogus",
      merge: mergeParameters
    });
    expect(merge).toHaveBeenCalledTimes(0);
  });
  it("delete branch when status is ready_for_merge and delete-branch-after-merge is enabled and branch resides in same repository", async () => {
    const githubGitdataDeleteReference = githubCallMock(null);
    const { context, pullRequestInfo } = mockPullRequestContext({
      config: {
        "delete-branch-after-merge": true
      },
      pullRequest: {
        base: {
          ref: "master",
          sha: "12345",
          user: {
            login: "john"
          },
          repo: {
            name: "test"
          }
        },
        head: {
          ref: "mybranch",
          sha: "56789",
          user: {
            login: "john"
          },
          repo: {
            name: "test"
          }
        }
      },
      pullRequestInfo: {
        owner: "john",
        repo: "test"
      },
      githubGitdataDeleteReference
    });
    await handlePullRequestStatus(context, pullRequestInfo, {
      code: "ready_for_merge",
      message: "bogus"
    });
    expect(githubGitdataDeleteReference).toHaveBeenCalledTimes(1);
    expect(githubGitdataDeleteReference.mock.calls[0]).toEqual([
      { owner: "john", ref: "heads/mybranch", repo: "test" }
    ]);
  });
  it("do not delete branch when status is ready_for_merge and delete-branch-after-merge is enabled, but branch resides in another repository", async () => {
    const githubGitdataDeleteReference = githubCallMock(null);
    const { context, pullRequestInfo } = mockPullRequestContext({
      config: {
        "delete-branch-after-merge": true
      },
      pullRequest: {
        base: {
          ref: "master",
          sha: "12345",
          user: {
            login: "john"
          },
          repo: {
            name: "test"
          }
        },
        head: {
          ref: "mybranch",
          sha: "56789",
          user: {
            login: "hank"
          },
          repo: {
            name: "test"
          }
        }
      },
      pullRequestInfo: {
        owner: "john",
        repo: "test"
      },
      githubGitdataDeleteReference
    });
    await handlePullRequestStatus(context, pullRequestInfo, {
      code: "ready_for_merge",
      message: "bogus"
    });
    expect(githubGitdataDeleteReference).toHaveBeenCalledTimes(0);
  });
});
