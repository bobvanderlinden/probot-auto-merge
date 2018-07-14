import { Context } from "probot";
import { Config } from "./config";
import { TaskScheduler } from "./task-scheduler";
import { PullRequest, Review, CheckRun, BranchProtection } from "./models";
import { groupBy, groupByMap } from "./utils";
import { AnyResponse } from "../node_modules/@octokit/rest";
const debug = require("debug")("pull-request-handler");

export interface HandlerContext {
  log: (msg: string) => void;
  github: Context["github"];
  config: Config;
}

interface PullRequestInfo {
  owner: string;
  repo: string;
  number: number;
}

interface PullRequestTask {
  context: HandlerContext;
  pullRequestInfo: PullRequestInfo;
}

const taskScheduler = new TaskScheduler<PullRequestTask>({
  worker: pullRequestWorker,
  concurrency: 8
});
const pullRequestTimeouts: {
  [key: string]: NodeJS.Timer;
} = {};

export function schedulePullRequestTrigger(
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
) {
  const queueName = getPullRequestKey(pullRequestInfo);
  if (!taskScheduler.hasQueued(queueName)) {
    taskScheduler.queue(queueName, { context, pullRequestInfo });
  }
}

function getPullRequestKey({ owner, repo, number }: PullRequestInfo) {
  return `${owner}/${repo}#${number}`;
}

async function pullRequestWorker({
  context,
  pullRequestInfo
}: PullRequestTask) {
  await handlePullRequestTrigger(context, pullRequestInfo);
}

async function handlePullRequestTrigger(
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
) {
  const { log: appLog } = context;
  const pullRequestKey = getPullRequestKey(pullRequestInfo);

  function log(msg: string) {
    appLog(`${pullRequestKey}: ${msg}`);
  }

  // Cancel any running scheduled timer for this pull request,
  // since we're now handling it right now.
  clearTimeout(pullRequestTimeouts[pullRequestKey]);

  const pullRequestContext = {
    ...context,
    log
  };
  await doPullRequestWork(pullRequestContext, pullRequestInfo);
}

async function doPullRequestWork(
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
) {
  const { log } = context;
  const pullRequestStatus = await getPullRequestStatus(
    context,
    pullRequestInfo
  );
  log(`result: ${pullRequestStatus.code}: ${pullRequestStatus.message}`);
  await handlePullRequestStatus(context, pullRequestInfo, pullRequestStatus);
}

/**
 * Checks the supplied response for errors and casts response data to
 * supplied type.
 * @param response The response from a GitHub API
 */
function result<TResult = void>(response: AnyResponse): TResult {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Response status was ${response.status}`);
  }
  return response.data;
}

export async function handlePullRequestStatus(
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo,
  pullRequestStatus: PullRequestStatus
) {
  const { log, github, config } = context;
  const { owner, repo, number } = pullRequestInfo;

  switch (pullRequestStatus.code) {
    case "ready_for_merge":
      // We're ready for merging!
      // This presses the merge button.
      result(
        await github.pullRequests.merge({
          owner,
          repo,
          number,
          merge_method: config["merge-method"]
        })
      );
      if (config["delete-branch-after-merge"]) {
        const pullRequest = result<PullRequest>(
          await github.pullRequests.get({
            owner,
            repo,
            number
          })
        );

        // Check whether the pull request's branch was actually part of the same repo, as
        // we do not want to (or rather do not have permission to) alter forks of this repo.
        if (
          pullRequest.head.user.login === owner &&
          pullRequest.head.repo.name === repo
        ) {
          result(
            await github.gitdata.deleteReference({
              owner,
              repo,
              ref: `heads/${pullRequest.head.ref}`
            })
          );
        }
      }
      return;
    case "out_of_date_branch":
      if (config["update-branch"]) {
        // This merges the baseRef on top of headRef of the PR.
        result(await github.repos.merge(pullRequestStatus.merge));
      }
      return;
    case "pending_checks":
      // Some checks (like Travis) seem to not always send
      // their status updates. Making this process being stalled.
      // We work around this issue by scheduling a recheck after
      // 1 minutes. The recheck is cancelled once another pull
      // request event comes by.
      log("Scheduling pull request trigger after 1 minutes");
      const pullRequestKey = getPullRequestKey(pullRequestInfo);
      debug(`Setting timeout for ${pullRequestKey}`);
      pullRequestTimeouts[pullRequestKey] = setTimeout(() => {
        /* istanbul ignore next */
        debug(`Timeout triggered for ${pullRequestKey}`);
        /* istanbul ignore next */
        schedulePullRequestTrigger(context, pullRequestInfo);
      }, 1 * 60 * 1000);
      return;
    default:
    // We will just wait for a next event from GitHub.
  }
}

interface OutOfDateBranchPullRequestStatus {
  code: "out_of_date_branch";
  message: string;
  merge: {
    owner: string;
    repo: string;
    base: string;
    head: string;
  };
}

type PullRequestStatus =
  | {
      code:
        | "merged"
        | "closed"
        | "not_open"
        | "pending_mergeable"
        | "conflicts"
        | "changes_requested"
        | "need_approvals"
        | "pending_checks"
        | "blocking_check"
        | "ready_for_merge";
      message: string;
    }
  | OutOfDateBranchPullRequestStatus;

type PullRequestStatusCode = PullRequestStatus["code"];

export const PullRequestStatusCodes: PullRequestStatusCode[] = [
  "merged",
  "closed",
  "not_open",
  "pending_mergeable",
  "conflicts",
  "changes_requested",
  "need_approvals",
  "pending_checks",
  "blocking_check",
  "ready_for_merge"
];

export async function getPullRequestStatus(
  context: HandlerContext,
  { owner, repo, number }: PullRequestInfo
): Promise<PullRequestStatus> {
  const { log, github, config } = context;

  const pullRequest = result<PullRequest>(
    await github.pullRequests.get({
      owner,
      repo,
      number
    })
  );

  // Check the status from basic pull request properties.
  if (pullRequest.merged) {
    return {
      code: "merged",
      message: "Pull request was already merged"
    };
  }

  if (pullRequest.state === "closed") {
    return {
      code: "closed",
      message: "Pull request is closed"
    };
  }

  if (pullRequest.state !== "open") {
    return {
      code: "not_open",
      message: "Pull request is not open"
    };
  }

  if (pullRequest.mergeable === null) {
    return {
      code: "pending_mergeable",
      message: "Mergeablity of pull request could not yet be determined"
    };
  }

  if (pullRequest.mergeable === false) {
    return {
      code: "conflicts",
      message: "Could not merge pull request due to conflicts"
    };
  }

  // Check the status from the pull request reviews.
  const reviews = result<Review[]>(
    await github.pullRequests.getReviews({
      owner,
      repo,
      number
    })
  );
  const sortedReviews = reviews.sort(
    (a, b) =>
      new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );
  const latestReviewsByUser = groupBy(
    review => review.user.login,
    sortedReviews
  );

  const reviewSummary = Object.entries(latestReviewsByUser)
    .map(([user, review]) => `${user}: ${review.state}`)
    .join("\n");

  log(`\nReviews:\n${reviewSummary}\n\n`);

  const latestReviews = Object.values(latestReviewsByUser);
  const changesRequestedCount = latestReviews.filter(
    review => review.state === "CHANGES_REQUESTED"
  ).length;
  if (changesRequestedCount > config["max-requested-changes"]) {
    return {
      code: "changes_requested",
      message: `There are changes requested by a reviewer (${changesRequestedCount} > ${
        config["max-requested-changes"]
      })`
    };
  }

  const approvalCount = latestReviews.filter(
    review => review.state === "APPROVED"
  ).length;
  if (approvalCount < config["min-approvals"]) {
    return {
      code: "need_approvals",
      message: `There are not enough approvals by reviewers (${approvalCount} / ${
        config["min-approvals"]
      })`
    };
  }

  // Check the status from the pull request checks.
  const checks = result<{ check_runs: CheckRun[] }>(
    await github.checks.listForRef({
      owner,
      repo,
      ref: pullRequest.head.sha,
      filter: "latest"
    })
  );
  const checkRuns = checks.check_runs;
  // log('checks: ' + JSON.stringify(checks))
  const checksSummary = checkRuns
    .map(
      checkRun => `${checkRun.name}: ${checkRun.status}: ${checkRun.conclusion}`
    )
    .join("\n");

  log(`\nChecks:\n${checksSummary}\n\n`);

  const allChecksCompleted = checkRuns.every(
    checkRun => checkRun.status === "completed"
  );
  if (!allChecksCompleted) {
    return {
      code: "pending_checks",
      message: "There are still pending checks"
    };
  }
  const checkConclusions = groupByMap(
    checkRun => checkRun.conclusion,
    _ => true,
    checkRuns
  );
  log("conclusions: " + JSON.stringify(checkConclusions));
  const checksBlocking =
    checkConclusions.failure ||
    checkConclusions.cancelled ||
    checkConclusions.timed_out ||
    checkConclusions.action_required;
  if (checksBlocking) {
    return {
      code: "blocking_check",
      message: "There are blocking checks"
    };
  }

  // Check the status from the pull request's base protected branch.
  const branchProtection = result<BranchProtection>(
    await github.repos.getBranchProtection({
      owner: pullRequest.base.user.login,
      repo: pullRequest.base.repo.name,
      branch: pullRequest.base.ref
    })
  );
  if (branchProtection.required_status_checks.strict) {
    log(`baseRef: ${pullRequest.base.ref}`);
    const branch = result<any>(
      await github.repos.getBranch({
        owner: pullRequest.base.user.login,
        repo: pullRequest.base.repo.name,
        branch: pullRequest.base.ref
      })
    );
    if (pullRequest.base.sha !== branch.commit.sha) {
      return {
        code: "out_of_date_branch",
        message: `Pull request is based on a strict protected branch (${
          pullRequest.base.ref
        }) and base sha of pull request (${
          pullRequest.base.sha
        }) differs from sha of branch (${branch.commit.sha})`,
        merge: {
          owner: pullRequest.head.user.login,
          repo: pullRequest.head.repo.name,
          base: pullRequest.head.ref,
          head: pullRequest.base.ref
        }
      };
    }
  }

  return {
    code: "ready_for_merge",
    message: "Pull request successfully merged"
  };
}
