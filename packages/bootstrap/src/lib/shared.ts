import { Context } from 'effect'

export type FailureCaseLiterals =
  | 'CreateFolder'
  | 'CreateProject'
  | 'EnableServices'
  | 'SetCurrentProject'
  | 'SetQuotaProject'
  | 'CreateBucket'
  | 'LinkBillingAccount'
  | undefined

export class FailureCase extends Context.Tag('FailureCase')<FailureCase, FailureCaseLiterals>() {}
