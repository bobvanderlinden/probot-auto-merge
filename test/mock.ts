import {
  Review,
  CheckRun,
  BranchProtection,
  PullRequest,
  ReviewState,
  Branch,
  PullRequestInfo
} from "../src/models";
import { Config, defaultConfig } from "../src/config";

export function githubCallMock<T>(data: T) {
  return jest.fn(async params => ({
    data: data
  }));
}

export function mockPullRequestContext(options?: {
  reviews?: Review[];
  checkRuns?: CheckRun[];
  branch?: Branch;
  branchProtection?: BranchProtection;
  mergeable?: boolean;
  merged?: boolean;
  githubRepoMerge?: Function;
  githubGitdataDeleteReference?: Function;
  state?: PullRequest["state"];
  config?: Partial<Config>;
  pullRequest?: Partial<PullRequest>;
  pullRequestInfo?: Partial<PullRequestInfo>;
}) {
  options = options || {};
  const merge = githubCallMock(null);
  const log = jest.fn((...args) => {
    // console.log(...args)
  });

  const pullRequest: PullRequest = {
    base: {
      ref: "master",
      sha: "5678",
      user: {
        login: "henk"
      },
      repo: {
        name: "test"
      }
    },
    head: {
      ref: "my_branch",
      sha: "12345",
      user: {
        login: "john"
      },
      repo: {
        name: "test"
      }
    },
    mergeable: options.mergeable === undefined ? true : options.mergeable,
    merged: options.merged === undefined ? false : options.merged,
    number: 1,
    state: options.state || "open",
    labels: [],
    ...options.pullRequest
  };

  return {
    pullRequestInfo: {
      owner: "henk",
      repo: "test",
      number: 1,
      ...options.pullRequestInfo
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
          merge: options.githubRepoMerge,
          getBranchProtection: githubCallMock(
            options.branchProtection || {
              required_status_checks: {
                strict: false
              }
            }
          ),
          getBranch: githubCallMock<Branch>(
            options.branch || {
              commit: {
                sha: "12345"
              },
              name: "mybranch",
              protected: false
            }
          )
        },
        gitdata: {
          deleteReference: options.githubGitdataDeleteReference
        }
      },
      config: {
        ...defaultConfig,
        minApprovals: {
          COLLABORATOR: 1
        },
        maxRequestedChanges: {
          COLLABORATOR: 0
        },
        updateBranch: true,
        deleteBranchAfterMerge: true,
        ...options.config
      }
    } as any
  };
}

export function review(options: Partial<Review> & { state: ReviewState }): Review {
  return {
    submitted_at: "2018-01-01",
    user: { login: "henk" },
    author_association: 'MEMBER',
    ...options
  };
}

export const approvedReview = (options?: Partial<Review>) =>
  review({
    state: "APPROVED",
    ...options
  });
export const changesRequestedReview = (options?: Partial<Review>) =>
  review({
    state: "CHANGES_REQUESTED",
    ...options
  });

export const successCheckRun: CheckRun = {
  name: "checka",
  status: "completed",
  conclusion: "success",
  head_sha: "12345",
  external_id: "1"
};
export const queuedCheckRun: CheckRun = {
  name: "checka",
  status: "queued",
  conclusion: null,
  head_sha: "12345",
  external_id: "1"
};
export const failedCheckRun: CheckRun = {
  name: "checka",
  status: "completed",
  conclusion: "failure",
  head_sha: "12345",
  external_id: "1"
};
export const neutralCheckRun: CheckRun = {
  name: "checka",
  status: "completed",
  conclusion: "neutral",
  head_sha: "12345",
  external_id: "1"
};
