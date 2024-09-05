import { execSync } from 'child_process'
import { Effect, Exit, Context, Layer, Data, Redacted } from 'effect'

export class CreateFolderError extends Data.TaggedError('CreateFolderError')<{
  readonly message: string
}> {}

export interface Folder {
  readonly id: string
  readonly name?: string
}

export class CreateFolder extends Context.Tag('CreateFolder')<
  CreateFolder,
  {
    readonly createFolder: (
      folderName: string,
      orgId: Redacted.Redacted<string>
    ) => Effect.Effect<Folder, CreateFolderError>
    readonly deleteFolder: (folder: Folder) => Effect.Effect<void>
  }
>() {
  static Live = Layer.sync(CreateFolder, () => {
    return {
      createFolder: (folderName, orgId) =>
        Effect.gen(function* () {
          yield* Effect.log(`[CreateFolder] Creating "${folderName}" folder`)

          const oid = Redacted.value(orgId)

          const output = yield* Effect.try({
            try: () =>
              execSync(
                `gcloud resource-manager folders create --display-name ${folderName} --organization ${oid} --format json`
              ),
            catch: () => new CreateFolderError({ message: 'Failed to create folder' }),
          })

          yield* Effect.log(`[CreateFolder] Created "${folderName}" folder`)

          return {
            id: JSON.parse(String(output)).name.split('/').pop(),
            name: folderName,
          }
        }),

      deleteFolder: (folder) =>
        Effect.sync(() => execSync(`gcloud resource-manager folders delete ${folder.id}`)).pipe(
          Effect.tap(() => Effect.log(`[CreateFolder] Deleted folder "${folder.name}"`))
        ),
    }
  })
}

export const createFolder = (folderName: string, orgId: Redacted.Redacted<string>) =>
  Effect.gen(function* () {
    const { createFolder, deleteFolder } = yield* CreateFolder
    return yield* Effect.acquireRelease(createFolder(folderName, orgId), (folder, exit) =>
      Exit.isFailure(exit) ? deleteFolder(folder) : Effect.void
    )
  })
