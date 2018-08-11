import { HandlerContext } from './../src/models';
import {
  BranchProtection,
  PullRequest,
  Branch,
  PullRequestReference
} from "../src/models";
import { Config, defaultConfig } from "../src/config";
import { PullRequestInfo } from "../src/pull-request-query";
import { GitHubAPI } from "probot/lib/github";

export type DeepPartial<T> = { [Key in keyof T]?: DeepPartial<T[Key]>; };
type ElementOf<TArray> = TArray extends Array<infer TElement> ? TElement : never;

type Review = ElementOf<PullRequestInfo["reviews"]["nodes"]>
type ReviewState = Review["state"]
type CheckRun = ElementOf<PullRequestInfo["checkRuns"]>

export function githubCallMock<T>(data: T) {
  return githubResponseMock({
    status: 200,
    data: data
  });
}

export function githubResponseMock<T>(response: { status: number, data: T }) {
  return jest.fn(async _params => response);
}

export function githubErrorResponseMock(errorParams: { code: number }) {
  return jest.fn(async _params => {
    const error: any = new Error();
    error.code = errorParams.code;
    throw error;
  })
}

export const defaultPullRequestInfo: PullRequestInfo = {
  number: 1,
  state: "OPEN",
  mergeable: "MERGEABLE",
  potentialMergeCommit: {
    oid: "da39a3ee5e6b4b0d3255bfef95601890afd80709"
  },
  baseRef: {
    name: 'master',
    repository: {
      name: "probot-auto-merge",
      owner: {
        login: "bobvanderlinden"
      }
    },
    target: {
      oid: "c00dbbc9dadfbe1e232e93a729dd4752fade0abf"
    }
  },
  baseRefOid: "c00dbbc9dadfbe1e232e93a729dd4752fade0abf",
  headRef: {
    name: "pr-some-change",
    repository: {
      name: "probot-auto-merge",
      owner: {
        login: "bobvanderlinden"
      }
    },
    target: {
      oid: "c2a6b03f190dfb2b4aa91f8af8d477a9bc3401dc"
    }
  },
  headRefOid: "c2a6b03f190dfb2b4aa91f8af8d477a9bc3401dc",
  authorAssociation: "OWNER",
  labels: {
    nodes: []
  },
  reviews: {
    nodes: []
  },
  repository: {
    protectedBranches: {
      nodes: []
    }
  },
  checkRuns: []
}


export function createPullRequestInfo(pullRequestInfo?: Partial<PullRequestInfo>): PullRequestInfo {
  return {
    ...defaultPullRequestInfo,
    ...pullRequestInfo
  }
}

export function createGithubApi(options?: DeepPartial<GitHubAPI>): GitHubAPI {
  return {
    ...options
   } as GitHubAPI
}

export function createConfig(options?: Partial<Config>): Config {
  return {
    ...defaultConfig,
    minApprovals: {
      MEMBER: 1
    },
    ...options,
  }
}

export function createHandlerContext(options?: Partial<HandlerContext>): HandlerContext {
  return {
    log: () => {},
    github: options && options.github || createGithubApi(),
    config: options && options.config || createConfig(),
    ...options
  }
}

export function mockPullRequestContext(options?: {
  reviews?: Review[];
  checkRuns?: CheckRun[];
  branch?: Branch;
  branchProtection?: BranchProtection;
  hasBranchProtection?: boolean,
  mergeable?: boolean;
  merged?: boolean;
  githubRepoMerge?: Function;
  githubGitdataDeleteReference?: Function;
  state?: PullRequest["state"];
  config?: Partial<Config>;
  pullRequest?: Partial<PullRequest>;
  PullRequestReference?: Partial<PullRequestReference>;
}) {
  options = options || {};
  const merge = githubCallMock(null);
  const log = jest.fn((...args) => {
    // console.log(...args)
  });
  const hasBranchProtection = options.hasBranchProtection === undefined ? false : options.hasBranchProtection;

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
    PullRequestReference: {
      owner: "henk",
      repo: "test",
      number: 1,
      ...options.PullRequestReference
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
          getBranchProtection: hasBranchProtection
            ? githubCallMock(
              options.branchProtection || {
                required_status_checks: {
                  strict: false
                }
              }
            )
            : githubErrorResponseMock({ code: 404 }),
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
    submittedAt: "2018-07-15T20:53:17Z",
    authorAssociation: 'MEMBER',
    author: {
      login: "henk"
    },
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
