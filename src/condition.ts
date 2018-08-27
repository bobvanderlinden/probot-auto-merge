import { ConditionConfig } from './config'
import { PullRequestInfo } from './models'

export type Condition = (config: ConditionConfig, pullRequestInfo: PullRequestInfo) => ConditionResult
export type ConditionResult = { status: 'success' } | { status: 'fail', message: string } | { status: 'pending', message?: string }
