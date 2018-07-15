import { Context } from "probot";
import { Config } from "./config";

export interface HandlerContext {
  log: (msg: string) => void;
  github: Context["github"];
  config: Config;
}

export interface PullRequestInfo {
  owner: string;
  repo: string;
  number: number;
}

export interface CheckPullRequest {
  number: number;
}

export interface PullRequest {
  base: {
    ref: string
    sha: string
    repo: {
      name: string
    }
    user: {
      login: string
    }
  }
  head: {
    ref: string
    sha: string
    repo: {
      name: string
    }
    user: {
      login: string
    }
  }
  number: number
  state: 'open' | 'closed'
  merged: boolean
  mergeable: boolean
}

export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED'

export interface Review {
  submitted_at: string
  state: ReviewState
  user: {
    login: string
  }
}

export interface CheckRun {
  name: string
  head_sha: string
  external_id: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required'
}

export interface BranchProtection {
  required_status_checks: {
    strict: boolean
  }
  enforce_admins: {
    enabled: boolean
  }
  required_pull_request_reviews: {
    dismiss_stale_reviews: boolean
    require_code_owner_reviews: boolean
    required_approving_review_count: number
  }
  restrictions: {}
}

export interface Branch {
  name: string;
  commit: {
    sha: string
  }
  protected: boolean
}
