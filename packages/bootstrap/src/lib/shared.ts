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

export enum GcpService {
  CloudBilling = 'cloudbilling.googleapis.com',
  CloudResourceManager = 'cloudresourcemanager.googleapis.com',
  Compute = 'compute.googleapis.com',
  ServiceUsage = 'serviceusage.googleapis.com',
  StorageComponent = 'storage-component.googleapis.com',
}
