import { execSync } from 'child_process'
import { Effect, Exit, Context, Layer } from 'effect'

import { FailureCase } from '../shared'

export class CreateFolderError {
  readonly _tag = 'CreateFolderError'
}

export interface Folder {
  readonly id: string
}

export class CreateFolder extends Context.Tag('CreateFolder')<
  CreateFolder,
  {
    readonly createFolder: (
      folderName: string,
      orgId: string
    ) => Effect.Effect<Folder, CreateFolderError>
    readonly deleteFolder: (folder: Folder) => Effect.Effect<void>
  }
>() {
  static Live = Layer.effect(
    CreateFolder,
    Effect.gen(function* () {
      const failureCase = yield* FailureCase

      return {
        createFolder: (folderName: string, orgId: string) =>
          Effect.gen(function* () {
            yield* Effect.log(`[CreateFolder] Creating "${folderName}" folder`)

            const output = yield* Effect.sync(() =>
              execSync(
                `gcloud resource-manager folders create --display-name ${folderName} --organization ${orgId} --format json`
              )
            )

            if (failureCase === 'CreateFolder') {
              return yield* Effect.fail(new CreateFolderError())
            } else {
              return { id: JSON.parse(String(output)).name.split('/').pop() }
            }
          }),

        deleteFolder: (folder) =>
          Effect.sync(() => execSync(`gcloud resource-manager folders delete ${folder.id}`)),
      }
    })
  )
}

export const createFolder = (folderName: string, orgId: string) =>
  Effect.gen(function* () {
    const { createFolder, deleteFolder } = yield* CreateFolder
    return yield* Effect.acquireRelease(createFolder(folderName, orgId), (folder, exit) =>
      Exit.isFailure(exit) ? deleteFolder(folder) : Effect.void
    )
  })
