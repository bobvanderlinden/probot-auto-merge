import {
  mockPullRequestContext,
  approvedReview,
  changesRequestedReview,
  successCheckRun,
  queuedCheckRun,
  failedCheckRun
} from "./mock";
import { getPullRequestStatus } from "../src/pull-request-status";

describe("getPullRequestStatus", () => {
  it("returns not_open when pull request state is a value that is undocumented", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      state: "this_value_is_undocumented" as any
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("not_open");
  });

  it("returns blocking_check when one check run failed", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      checkRuns: [successCheckRun, failedCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("blocking_check");
  });

  it("returns changes_requested when one reviewer requested changes", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview("henk"), changesRequestedReview("sjaak")],
      checkRuns: [successCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("changes_requested");
  });

  it("returns changes_requested when same reviewer approved and requested changes", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview("henk"), changesRequestedReview("henk")],
      checkRuns: [successCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("changes_requested");
  });

  it("returns pending_checks when check run is still queued", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      checkRuns: [queuedCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("pending_checks");
  });

  it("returns ready_for_merge when reviewer requested changes and approved", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [changesRequestedReview("henk"), approvedReview("henk")]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns ready_for_merge when pull request is approved and check run succeeded", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      checkRuns: [successCheckRun]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns ready_for_merge when pull request is approved", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("ready_for_merge");
  });

  it("returns closed when pull request is closed", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      state: "closed"
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("closed");
  });

  it("returns conflicts when pull request is not mergeable", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      mergeable: false
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("conflicts");
  });

  it("returns pending_mergeable when pull request is not mergeable", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      mergeable: null
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("pending_mergeable");
  });

  it("returns merged when pull request is already merged", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      merged: true
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("merged");
  });

  it("returns need_approvals when pull request is not reviewed", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext();
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("need_approvals");
  });

  it("returns out_of_date_branch when pull request is based on strict protected branch", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      reviews: [approvedReview()],
      branchProtection: {
        required_status_checks: {
          strict: true
        },
        enforce_admins: { enabled: true },
        required_pull_request_reviews: {
          dismiss_stale_reviews: true,
          require_code_owner_reviews: true,
          required_approving_review_count: 1
        },
        restrictions: []
      }
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("out_of_date_branch");
  });

  it("returns requires_label when a required label is configured, but not set on pull request", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      config: {
        "required-labels": [
          'mylabel'
        ]
      },
      reviews: [approvedReview()]
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("requires_label");
  });

  it("returns ready_for_merge when a required label is configured and it is set on pull request", async () => {
    const { context, pullRequestInfo } = mockPullRequestContext({
      config: {
        "required-labels": [
          'mylabel'
        ]
      },
      reviews: [approvedReview()],
      pullRequest: {
        labels: [{
          name: 'mylabel'
        }]
      }
    });
    const status = await getPullRequestStatus(context, pullRequestInfo);
    expect(status.code).toBe("ready_for_merge");
  });
});
