import { Effect, Layer, Logger } from 'effect'

import { CliArgs } from './cli'
import { createBucket, CreateBucket } from './services/CreateBucket'
import { createFolder, CreateFolder } from './services/CreateFolder'
import { createProject, CreateProject } from './services/CreateProject'
import { enable, EnableServices } from './services/EnableServices'
import { linkBillingAccount, LinkBillingAccount } from './services/LinkBillingAccount'
import { setCurrentProject, SetCurrentProject } from './services/SetCurrentProject'
import { setQuotaProject, SetQuotaProject } from './services/SetQuotaProject'
import { FailureCase } from './shared'

const layers = Layer.mergeAll(
  Logger.pretty,
  CreateFolder.Live,
  CreateProject.Live,
  EnableServices.Live,
  SetCurrentProject.Live,
  SetQuotaProject.Live,
  LinkBillingAccount.Live,
  CreateBucket.Live
)

export const make = (o: CliArgs) =>
  Effect.scoped(
    Effect.gen(function* () {
      const folder = yield* createFolder(o.folderName, o.orgId)
      const project = yield* createProject(o.projectName, folder.id)

      yield* setCurrentProject(project.id)

      yield* enable(project.id, [
        'cloudresourcemanager.googleapis.com',
        'cloudbilling.googleapis.com',
        'serviceusage.googleapis.com',
      ])

      yield* setQuotaProject(project.id)
      yield* linkBillingAccount(project.id, o.billingAccountId)

      yield* enable(project.id, ['compute.googleapis.com', 'storage-component.googleapis.com'])

      yield* createBucket(o.bucketName, project.id)
    })
  )

export const bootstrap = (args: CliArgs) =>
  make(args).pipe(Effect.provide(layers), Effect.provideService(FailureCase, undefined))
