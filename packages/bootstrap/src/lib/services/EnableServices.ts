import { execSync } from 'child_process'
import { Context, Data, Effect, Layer } from 'effect'

export class EnableServicesError extends Data.TaggedError('EnableServicesError')<{
  readonly message: string
}> {}

export class EnableServices extends Context.Tag('EnableServices')<
  EnableServices,
  {
    readonly enable: (
      projectId: string,
      services: string[]
    ) => Effect.Effect<void, EnableServicesError>
  }
>() {
  static Live = Layer.sync(EnableServices, () => {
    return {
      enable: (projectId: string, services: string[]) =>
        Effect.gen(function* () {
          yield* Effect.log(`[EnableServices] Enabling services for project "${projectId}"`)

          yield* Effect.try({
            try: () =>
              execSync(
                `gcloud services enable ${services.join(' ')} --project ${projectId} --format json`
              ),
            catch: () => new EnableServicesError({ message: 'Failed to enable services' }),
          })

          yield* Effect.log(`[EnableServices] Enabled services for project "${projectId}"`)
        }),
    }
  })
}

export const enable = (projectId: string, services: string[]) =>
  Effect.gen(function* () {
    const { enable } = yield* EnableServices
    yield* enable(projectId, services)
  })
