import { TaskScheduler } from "./task-scheduler";
import { PullRequest, HandlerContext, PullRequestInfo } from "./models";
import { result } from "./utils";
import { getPullRequestStatus, PullRequestStatus } from "./pull-request-status";
const debug = require("debug")("pull-request-handler");

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
          merge_method: config.mergeMethod
        })
      );
      if (config.deleteBranchAfterMerge) {
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
      if (config.updateBranch) {
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
