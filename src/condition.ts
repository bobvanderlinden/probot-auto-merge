import { HandlerContext, PullRequestInfo } from './models'

export type Condition = (context: HandlerContext, pullRequestInfo: PullRequestInfo) => ConditionResult
export type ConditionResult = { status: 'success' } | { status: 'fail', message: string } | { status: 'pending', message?: string }
