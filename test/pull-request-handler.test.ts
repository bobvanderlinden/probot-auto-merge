import {
  schedulePullRequestTrigger,
  HandlerContext,
  getPullRequestStatus,
  handlePullRequestStatus,
  PullRequestStatusCodes
} from "../src/pull-request-handler";
import { PullRequest, CheckRun, Review, ReviewState, BranchProtection } from "../src/models";

const unused: any = undefined;

function githubCallMock(data: any) {
  return jest.fn(async params => ({
    data: data
  }));
}

function mockPullRequestContext(options?: {
  reviews?: Review[];
  checkRuns?: CheckRun[];
  branch?: any,
  branchProtection?: BranchProtection,
  maxRequestedChanged?: number;
  minApprovals?: number;
  mergeable?: boolean;
  merged?: boolean;
  state?: PullRequest["state"];
}) {
  options = options || {};
  const merge = githubCallMock(null);
  const log = jest.fn((...args) => {
    // console.log(...args)
  });

  const pullRequest = {
    base: {
      repo: {
        name: "test"
      },
      user: {
        login: "henk"
      }
    },
    head: {
      sha: "12345"
    },
    mergeable: options.mergeable === undefined ? true : options.mergeable,
    merged: options.merged === undefined ? false : options.merged,
    number: 1,
    state: options.state || "open"
  };

  return {
    pullRequestInfo: {
      owner: "henk",
      repo: "test",
      number: 1
    },
    merge: merge,
    context: {
      log,
      github: {
        pullRequests: {
          get: githubCallMock(pullRequest),
          getReviews: githubCallMock(options.reviews || []),
          merge
        },
        checks: {
          listForRef: githubCallMock({
            check_runs: options.checkRuns || []
          })
        },
        repos: {
          getBranchProtection: githubCallMock(options.branchProtection || {
            required_status_checks: {
              strict: false
            }
          }),
          getBranch: githubCallMock(options.branch)
        }
      },
      config: {
        "max-requested-changes": options.maxRequestedChanged || 0,
        "min-approvals": options.minApprovals || 1
      }
    } as any
  };
}

function review(options: { name?: string; state: ReviewState }): Review {
  return {
    state: options.state,
    submitted_at: "2018-01-01",
    user: { login: options.name || "henk" }
  };
}

const approvedReview = (name?: string) => review({ name, state: "APPROVED" });
const changesRequestedReview = (name?: string) =>
  review({ name, state: "CHANGES_REQUESTED" });

const successCheckRun: CheckRun = {
  name: "checka",
  status: "completed",
  conclusion: "success",
  head_sha: "12345",
  external_id: "1"
};
const queuedCheckRun: CheckRun = {
  name: "checka",
  status: "queued",
  conclusion: null,
  head_sha: "12345",
  external_id: "1"
};
const failedCheckRun: CheckRun = {
  name: "checka",
  status: "completed",
  conclusion: "failure",
  head_sha: "12345",
  external_id: "1"
};
const neutralCheckRun: CheckRun = {
  name: "checka",
  status: "completed",
  conclusion: "neutral",
  head_sha: "12345",
  external_id: "1"
};

describe("getPullRequestStatus", () => {
  it("returns not_open when pull request state is a value that is undocumented", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      state: "this_value_is_undocumented" as any
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("not_open");
  });

  it("returns blocking_check when one check run failed", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      checkRuns: [successCheckRun, failedCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("blocking_check");
  });

  it("returns changes_requested when one reviewer requested changes", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview("henk"), changesRequestedReview("sjaak")],
      checkRuns: [successCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("changes_requested");
  });

  it("returns changes_requested when same reviewer approved and requested changes", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview("henk"), changesRequestedReview("henk")],
      checkRuns: [successCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("changes_requested");
  });

  it("returns pending_checks when check run is still queued", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      checkRuns: [queuedCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("pending_checks");
  });

  it("returns ready_for_merge when reviewer requested changes and approved", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [changesRequestedReview("henk"), approvedReview("henk")]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns ready_for_merge when pull request is approved and check run succeeded", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      checkRuns: [successCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns ready_for_merge when pull request is approved", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns closed when pull request is closed", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      state: "closed"
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("closed");
  });

  it("returns conflicts when pull request is not mergeable", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      mergeable: false
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("conflicts");
  });

  it("returns pending_mergeable when pull request is not mergeable", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      mergeable: null
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("pending_mergeable");
  });

  it("returns merged when pull request is already merged", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      merged: true
    });
    await schedulePullRequestTrigger(context, pullRequestInfo);
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("merged");
  });

  it("returns need_approvals when pull request is not reviewed", async () => {
    const { merge, context, pullRequestInfo } = mockPullRequestContext();
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("need_approvals");
  });
});

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
});
