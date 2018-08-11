import {
  mockPullRequestContext,
  approvedReview,
  changesRequestedReview,
  successCheckRun,
  queuedCheckRun,
  failedCheckRun,
  createHandlerContext,
  createPullRequestInfo,
  createConfig,
  defaultPullRequestInfo
} from "./mock";
import { getPullRequestStatus } from "../src/pull-request-status";
import { PullRequestState } from "../src/pull-request-query";

describe("getPullRequestStatus", () => {
  it("returns not_open when pull request state is a value that is undocumented", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview()] },
        state: "this_value_is_undocumented" as PullRequestState
      })
    );
    expect(status.code).toBe("not_open");
  });

  it("returns blocking_check when one check run failed", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext({
        config: createConfig()
      }),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview()] },
        checkRuns: [successCheckRun, failedCheckRun]
      })
    );
    expect(status.code).toBe("blocking_check");
  });

  it("returns changes_requested when one reviewer requested changes", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          minApprovals: {
            MEMBER: 1
          },
          maxRequestedChanges: {
            MEMBER: 0
          }
        })
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: "henk" }, authorAssociation: 'MEMBER' }),
            changesRequestedReview({ author: { login: "sjaak" }, authorAssociation: 'MEMBER' })
          ]
        },
        checkRuns: [successCheckRun]
      })
    );
    expect(status.code).toBe("changes_requested");
  });

  it("returns changes_requested when owner approved, but member requested changes", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          minApprovals: {
            OWNER: 1,
            MEMBER: 1
          },
          maxRequestedChanges: {
            OWNER: 0,
            MEMBER: 0
          }
        })
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: "henk" }, authorAssociation: 'OWNER' }),
            changesRequestedReview({ author: { login: "sjaak" }, authorAssociation: 'MEMBER' })
          ]
        },
        checkRuns: [successCheckRun],
      })
    );
    expect(status.code).toBe("changes_requested");
  });

  it("returns ready_for_merge when owner approved, but user requested changes", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          minApprovals: {
            OWNER: 1,
            MEMBER: 1
          },
          maxRequestedChanges: {
            OWNER: 0,
            MEMBER: 0
          }
        }),
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: "henk" }, authorAssociation: 'OWNER' }),
            changesRequestedReview({ author: { login: "sjaak" }, authorAssociation: 'NONE' })
          ]
        },
        checkRuns: [successCheckRun],
      })
    );
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns ready_for_merge when two members approved, but user requested changes", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          minApprovals: {
            MEMBER: 2
          },
          maxRequestedChanges: {
            MEMBER: 0
          }
        })
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: "henk" }, authorAssociation: 'OWNER' }),
            approvedReview({ author: { login: "sjaak" }, authorAssociation: 'MEMBER' }),
            changesRequestedReview({ author: { login: "piet" }, authorAssociation: 'NONE' })
          ]
        },
        checkRuns: [successCheckRun]
      })
    );
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns ready_for_merge when two members approved, but user requested changes", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          minApprovals: {
            MEMBER: 2
          },
          maxRequestedChanges: {
            MEMBER: 0
          }
        })
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview({ author: { login: "henk" }, authorAssociation: 'OWNER' }),
            approvedReview({ author: { login: "sjaak" }, authorAssociation: 'MEMBER' }),
            changesRequestedReview({ author: { login: "piet" }, authorAssociation: 'NONE' })
          ]
        },
        checkRuns: [successCheckRun],
      })
    );
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns changes_requested when same reviewer approved and requested changes", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview({ author: { login: "henk" } }), changesRequestedReview({ author: { login: "henk" } })] },
        checkRuns: [successCheckRun]
      })
    );
    expect(status.code).toBe("changes_requested");
  });

  it("returns pending_checks when check run is still queued", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview()] },
        checkRuns: [queuedCheckRun]
      })
    );
    expect(status.code).toBe("pending_checks");
  });

  it("returns ready_for_merge when reviewer requested changes and approved", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: { nodes: [changesRequestedReview({ author: { login: "henk" } }), approvedReview({ author: { login: "henk" } })] }
      })
    );
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns ready_for_merge when pull request is approved and check run succeeded", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview()] },
        checkRuns: [successCheckRun]
      })
    );
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns ready_for_merge when pull request is approved", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview()] }
      })
    );
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns closed when pull request is closed", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview()
          ]
        },
        state: "CLOSED"
      })
    );
    expect(status.code).toBe("closed");
  });

  it("returns conflicts when pull request is not mergeable", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview()] },
        mergeable: "CONFLICTING"
      })
    );
    expect(status.code).toBe("conflicts");
  });

  it("returns pending_mergeable when pull request is not mergeable", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview()] },
        mergeable: "UNKNOWN"
      })
    );
    expect(status.code).toBe("pending_mergeable");
  });

  it("returns merged when pull request is already merged", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview()] },
        state: "MERGED"
      })
    );
    expect(status.code).toBe("merged");
  });

  it("returns need_approvals when pull request is not reviewed", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo()
    );
    expect(status.code).toBe("need_approvals");
  });

  it("returns out_of_date_branch when pull request is based on strict protected branch", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext(),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview()
          ]
        },
        baseRef: {
          ...defaultPullRequestInfo.baseRef,
          name: "master",
          target: {
            oid: "1111111111111111111111111111111111111111",
          }
        },
        baseRefOid: "0000000000000000000000000000000000000000",
        repository: {
          protectedBranches: {
            nodes: [{
              name: "master",
              hasRestrictedPushes: true,
              hasStrictRequiredStatusChecks: true
            }]
          }
        }
      })
    );
    expect(status.code).toBe("out_of_date_branch");
  });

  it("returns requires_label when a required label is configured, but not set on pull request", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          requiredLabels: [
            'mylabel'
          ]
        })
      }),
      createPullRequestInfo({
        reviews: { nodes: [approvedReview()] }
      })
    );
    expect(status.code).toBe("requires_label");
  });

  it("returns ready_for_merge when a required label is configured and it is set on pull request", async () => {
    const status = await getPullRequestStatus(
      createHandlerContext({
        config: createConfig({
          requiredLabels: [
            'mylabel'
          ]
        })
      }),
      createPullRequestInfo({
        reviews: {
          nodes: [
            approvedReview()
          ]
        },
        labels: {
          nodes: [{
            name: 'mylabel'
          }]
        }
      })
    );
    expect(status.code).toBe("ready_for_merge");
  });
});
