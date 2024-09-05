import { Context, Effect, Layer } from 'effect'
import { FailureCase } from '../shared'
import { execSync } from 'child_process'

export class EnableServicesError {
  readonly _tag = 'EnableServicesError'
}

export class EnableServices extends Context.Tag('EnableServices')<
  EnableServices,
  {
    readonly enable: (
      projectId: string,
      services: string[]
    ) => Effect.Effect<void, EnableServicesError>
  }
>() {
  static Live = Layer.effect(
    EnableServices,
    Effect.gen(function* () {
      const failureCase = yield* FailureCase

      return {
        enable: (projectId: string, services: string[]) =>
          Effect.gen(function* () {
            yield* Effect.log(`[EnableServices] Enabling services for project "${projectId}"`)

            yield* Effect.sync(() =>
              execSync(
                `gcloud services enable ${services.join(' ')} --project ${projectId} --format json`
              )
            )

            if (failureCase === 'EnableServices') {
              return yield* Effect.fail(new EnableServicesError())
            } else {
              return Effect.void
            }
          }),
      }
    })
  )
}

export const enable = (projectId: string, services: string[]) =>
  Effect.gen(function* () {
    const { enable } = yield* EnableServices
    yield* enable(projectId, services)
  })
