export interface CheckPullRequest {
  number: number;
}

export interface PullRequest {
  base: {
    repo: {
      name: string
    }
    user: {
      login: string
    }
  }
  head: {
    sha: string
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
