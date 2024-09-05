import { execSync } from 'child_process'
import { Effect, Exit, Context, Layer } from 'effect'

import { FailureCase } from '../shared'
import { Project } from './CreateProject'

export class SetQuotaProjectError {
  readonly _tag = 'SetQuotaProjectError'
}

export class SetQuotaProject extends Context.Tag('SetQuotaProject')<
  SetQuotaProject,
  {
    readonly setQuotaProject: (projectId: string) => Effect.Effect<Project, SetQuotaProjectError>
    readonly setPreviousQuotaProject: (project: Project) => Effect.Effect<void>
  }
>() {
  static Live = Layer.effect(
    SetQuotaProject,
    Effect.gen(function* () {
      const failureCase = yield* FailureCase
      return {
        setQuotaProject: (projectId: string) =>
          Effect.gen(function* () {
            yield* Effect.log(`[SetQuotaProject] Setting quota project for project "${projectId}"`)

            const currentProjectId = execSync('gcloud config get-value project').toString().trim()

            yield* Effect.sync(() =>
              execSync(`gcloud auth application-default set-quota-project ${projectId}`)
            )

            if (failureCase === 'SetQuotaProject') {
              return yield* Effect.fail(new SetQuotaProjectError())
            } else {
              return { id: currentProjectId }
            }
          }),

        setPreviousQuotaProject: (project) =>
          Effect.sync(() =>
            execSync(`gcloud auth application-default set-quota-project ${project.id}`)
          ),
      }
    })
  )
}

export const setQuotaProject = (projectId: string) =>
  Effect.gen(function* () {
    const { setQuotaProject, setPreviousQuotaProject } = yield* SetQuotaProject
    return yield* Effect.acquireRelease(setQuotaProject(projectId), (project, exit) =>
      Exit.isFailure(exit) ? setPreviousQuotaProject(project) : Effect.void
    )
  })
