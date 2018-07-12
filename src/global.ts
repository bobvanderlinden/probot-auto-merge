declare function setTimeout(fn: Function, millis: number): number

declare module "probot-config" {
  export function getConfig<TContext, TConfig>(context: TContext, fileName: String, defaultConfig: TConfig): TConfig
}


interface CheckPullRequest {
  number: number;
}

interface PullRequest {
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

type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED'

interface Review {
  submitted_at: string
  state: ReviewState
  user: {
    login: string
  }
}

interface CheckRun {
  name: string
  head_sha: string
  external_id: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required'
}
