import { Effect, Layer, Redacted } from 'effect'

import * as s from './services'
import { BootstrapArgs } from './cli'
import { GcpService } from './shared'

const layers = Layer.mergeAll(
  s.CreateFolder.Live,
  s.CreateProject.Live,
  s.EnableServices.Live,
  s.SetCurrentProject.Live,
  s.SetQuotaProject.Live,
  s.LinkBillingAccount.Live,
  s.CreateBucket.Live
)

const make = ({ orgId, billingAccountId, folderName, projectName, bucketName }: BootstrapArgs) =>
  Effect.scoped(
    Effect.gen(function* () {
      const folder = yield* s.createFolder(folderName, Redacted.make(orgId))
      const project = yield* s.createProject(projectName, folder.id)
      yield* s.setCurrentProject(project.id)
      yield* s.enableServices(project.id, [
        GcpService.CloudResourceManager,
        GcpService.CloudBilling,
        GcpService.ServiceUsage,
      ])
      yield* s.setQuotaProject(project.id)
      yield* s.linkBillingAccount(project.id, Redacted.make(billingAccountId))
      yield* s.enableServices(project.id, [GcpService.Compute, GcpService.StorageComponent])
      yield* s.createBucket(bucketName, project.id)
    })
  )

export const bootstrap = (args: BootstrapArgs) => make(args).pipe(Effect.provide(layers))
