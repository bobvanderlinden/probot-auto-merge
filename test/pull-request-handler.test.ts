import { handlePullRequest, HandlerContext } from "../src/pull-request-handler";
import { PullRequest, CheckRun, Review, ReviewState } from "../src/models";

const unused: any = undefined;

function githubCallMock(data: any) {
  return jest.fn(async params => ({
    data: data
  }));
}

function mockPullRequestContext(options?: {
  reviews?: Review[];
  checkRuns?: CheckRun[];
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
  return {
    merge: merge,
    context: {
      log,
      github: {
        pullRequests: {
          getReviews: githubCallMock(options.reviews || []),
          merge
        },
        checks: {
          listForRef: githubCallMock({
            check_runs: options.checkRuns || []
          })
        }
      },
      config: {
        "max-requested-changes": options.maxRequestedChanged || 0,
        "min-approvals": options.minApprovals || 1
      }
    } as any,
    pullRequest: {
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
      mergeable: options.mergeable == undefined ? true : options.mergeable,
      merged: options.merged === undefined ? false : options.merged,
      number: 1,
      state: options.state || "open"
    }
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

describe("handlePullRequest", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it("does not merge when one check run failed", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview()],
      checkRuns: [successCheckRun, failedCheckRun]
    });
    await handlePullRequest(context, pullRequest);
    expect(merge).toHaveBeenCalledTimes(0);
  });

  it("does not merge when one reviewer requested changes", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview("henk"), changesRequestedReview("sjaak")],
      checkRuns: [successCheckRun]
    });
    await handlePullRequest(context, pullRequest);
    expect(merge).toHaveBeenCalledTimes(0);
  });

  it("does not merge when same reviewer approved and requested changes", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview("henk"), changesRequestedReview("henk")],
      checkRuns: [successCheckRun]
    });
    await handlePullRequest(context, pullRequest);
    expect(merge).toHaveBeenCalledTimes(0);
  });

  it("does not merge when check run is still queued", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview()],
      checkRuns: [queuedCheckRun]
    });
    await handlePullRequest(context, pullRequest);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(merge).toHaveBeenCalledTimes(0);
  });

  it("does merge when reviewer requested changes and approved", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview("henk"), changesRequestedReview("henk")]
    });
    await handlePullRequest(context, pullRequest);
    expect(merge).toHaveBeenCalledTimes(0);
  });

  it("merges when pull request is approved and check run succeeded", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview()],
      checkRuns: [successCheckRun]
    });
    await handlePullRequest(context, pullRequest);
    expect(merge).toHaveBeenCalledTimes(1);
  });

  it("merges when pull request is approved", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview()]
    });
    await handlePullRequest(context, pullRequest);
    expect(merge).toHaveBeenCalledTimes(1);
  });

  it("does not merge when pull request is closed", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview()],
      state: "closed"
    });
    await handlePullRequest(context, pullRequest);
    expect(setTimeout).toHaveBeenCalledTimes(0);
    expect(merge).toHaveBeenCalledTimes(0);
  });

  it("does not merge when pull request is not mergeable", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview()],
      mergeable: false
    });
    await handlePullRequest(context, pullRequest);
    expect(setTimeout).toHaveBeenCalledTimes(0);
    expect(merge).toHaveBeenCalledTimes(0);
  });

  it("does not merge when pull request is already merged", async () => {
    const { merge, context, pullRequest } = mockPullRequestContext({
      reviews: [approvedReview()],
      merged: true
    });
    await handlePullRequest(context, pullRequest);
    expect(setTimeout).toHaveBeenCalledTimes(0);
    expect(merge).toHaveBeenCalledTimes(0);
  });
});

it("does not merge when pull request is not reviewed", async () => {
  const { merge, context, pullRequest } = mockPullRequestContext();
  await handlePullRequest(context, pullRequest);
  expect(merge).toHaveBeenCalledTimes(0);
});
