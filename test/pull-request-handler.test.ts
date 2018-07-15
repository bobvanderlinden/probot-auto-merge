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
});
