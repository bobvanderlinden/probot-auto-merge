import {
  HandlerContext,
  PullRequestInfo,
  Review,
  CheckRun,
  BranchProtection,
  PullRequest,
  Branch
} from "./models";
import { result, groupByLast, groupByLastMap } from "./utils";
import { associations, getAssociationPriority } from "./association";

export interface OutOfDateBranchPullRequestStatus {
  code: "out_of_date_branch";
  message: string;
  merge: {
    owner: string;
    repo: string;
    base: string;
    head: string;
  };
}

export type PullRequestStatus =
  | {
      code:
        | "merged"
        | "closed"
        | "not_open"
        | "requires_label"
        | "blocking_label"
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

export type PullRequestStatusCode = PullRequestStatus["code"];

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
  "out_of_date_branch",
  "ready_for_merge"
];

function getPullRequestStatusFromPullRequest(
  pullRequest: PullRequest
): PullRequestStatus | null {
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

  return null;
}

function getPullRequestStatusFromLabels(
  context: HandlerContext,
  pullRequest: PullRequest
): PullRequestStatus | null {
  const { config } = context;
  function hasLabel(labelName: string): boolean {
    return pullRequest.labels.some(label => label.name === labelName);
  }

  const missingRequiredLabels = config.requiredLabels.filter(
    requiredLabel => !hasLabel(requiredLabel)
  );
  if (missingRequiredLabels.length > 0) {
    return {
      code: "requires_label",
      message: `Required labels are missing (${missingRequiredLabels.join(
        ", "
      )})`
    };
  }

  const matchingBlockingLabels = config.blockingLabels.filter(
    blockingLabel => hasLabel(blockingLabel)
  );
  if (matchingBlockingLabels.length > 0) {
    return {
      code: "blocking_label",
      message: `Blocking labels were added to the pull request (${
        matchingBlockingLabels.join(", ")
      })`
    };
  }

  return null
}

async function getPullRequestStatusFromReviews(
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): Promise<PullRequestStatus | null> {
  const { github, config, log } = context;
  const reviews = result<Review[]>(
    await github.pullRequests.getReviews(pullRequestInfo)
  );
  const sortedReviews = reviews.sort(
    (a, b) =>
      new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );
  const latestReviewsByUser = groupByLast(
    review => review.user.login,
    sortedReviews
  );

  const reviewSummary = Object.entries(latestReviewsByUser)
    .map(([user, review]) => `${user}: ${review.state}`)
    .join("\n");

  log(`\nReviews:\n${reviewSummary}\n\n`);

  const latestReviews = Object.values(latestReviewsByUser);

  let approvedByOneAssociation = false
  for (let association of associations) {
    const associationReviews = latestReviews.filter(review => getAssociationPriority(review.author_association) >= getAssociationPriority(association))

    const changesRequestedCount = associationReviews.filter(review => review.state === 'CHANGES_REQUESTED').length
    const maxRequestedChanges = config.maxRequestedChanges[association]
    if (maxRequestedChanges !== undefined && changesRequestedCount > maxRequestedChanges) {
      return {
        code: "changes_requested",
        message: `There are changes requested by a reviewer.`
      };
    }

    const approvalCount = associationReviews.filter(review => review.state === 'APPROVED').length
    const minApprovals = config.minApprovals[association]
    if (minApprovals !== undefined && approvalCount >= minApprovals) {
      approvedByOneAssociation = true;
    }
  }

  if (approvedByOneAssociation) {
    return null;
  } else {
    return {
      code: "need_approvals",
      message: `There are not enough approvals by reviewers`
    };
  }
}

async function getPullRequestStatusFromChecks(
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo,
  headSha: string
): Promise<PullRequestStatus | null> {
  const { github, log } = context;
  const { owner, repo } = pullRequestInfo;
  const checks = result<{ check_runs: CheckRun[] }>(
    await github.checks.listForRef({
      owner,
      repo,
      ref: headSha,
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
  const checkConclusions = groupByLastMap(
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

  return null;
}

async function hasStrictBranchChecks(
  context: HandlerContext,
  { owner, repo, branch }: { owner: string, repo: string, branch: string }
): Promise<boolean> {
  const { github } = context

  try {
    const branchProtection = result<BranchProtection>(await github.repos.getBranchProtection({
      owner: owner,
      repo: repo,
      branch: branch
    }));
    return branchProtection.required_status_checks.strict;
  } catch (err) {
    if (err.code === 404) {
      return false;
    } else {
      throw err;
    }
  }
}

async function getPullRequestStatusFromProtectedBranch(
  context: HandlerContext,
  pullRequest: PullRequest
): Promise<PullRequestStatus | null> {
  const { github, log } = context;

  const strictBranchChecks = await hasStrictBranchChecks(context, {
    owner: pullRequest.base.user.login,
    repo: pullRequest.base.repo.name,
    branch: pullRequest.base.ref
  });
  if (strictBranchChecks) {
    log(`baseRef: ${pullRequest.base.ref}`);
    const branch = result<Branch>(
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

  return null;
}

export async function getPullRequestStatus(
  context: HandlerContext,
  pullRequestInfo: PullRequestInfo
): Promise<PullRequestStatus> {
  const { github } = context;

  const pullRequest = result<PullRequest>(
    await github.pullRequests.get(pullRequestInfo)
  );

  return (
    getPullRequestStatusFromPullRequest(pullRequest) ||
    getPullRequestStatusFromLabels(context, pullRequest) ||
    (await getPullRequestStatusFromReviews(context, pullRequestInfo)) ||
    (await getPullRequestStatusFromChecks(
      context,
      pullRequestInfo,
      pullRequest.head.sha
    )) ||
    (await getPullRequestStatusFromProtectedBranch(context, pullRequest)) || {
      code: "ready_for_merge",
      message: "Pull request successfully merged"
    }
  );
}
