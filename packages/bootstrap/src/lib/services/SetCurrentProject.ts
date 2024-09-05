import { execSync } from 'child_process'
import { Context, Effect, Exit, Layer } from 'effect'

import { FailureCase } from '../shared'
import { Project } from './CreateProject'

export class SetCurrentProjectError {
  readonly _tag = 'SetCurrentProjectError'
}

export class SetCurrentProject extends Context.Tag('SetCurrentProject')<
  SetCurrentProject,
  {
    readonly setCurrentProject: (
      projectId: string
    ) => Effect.Effect<Project, SetCurrentProjectError>
    readonly setPreviousProject: (project: Project) => Effect.Effect<void>
  }
>() {
  static Live = Layer.effect(
    SetCurrentProject,
    Effect.gen(function* () {
      const failureCase = yield* FailureCase
      return {
        setCurrentProject: (projectId: string) =>
          Effect.gen(function* () {
            yield* Effect.log(`[SetCurrentProject] Setting current project to "${projectId}"`)

            const currentProjectId = execSync('gcloud config get-value project').toString().trim()

            yield* Effect.sync(() => execSync(`gcloud config set project ${projectId}`))

            if (failureCase === 'SetCurrentProject') {
              return yield* Effect.fail(new SetCurrentProjectError())
            } else {
              return { id: currentProjectId }
            }
          }),

        setPreviousProject: (project) =>
          Effect.sync(() => execSync(`gcloud config set project ${project.id}`)),
      }
    })
  )
}

export const setCurrentProject = (projectId: string) =>
  Effect.gen(function* () {
    const { setCurrentProject, setPreviousProject } = yield* SetCurrentProject
    return yield* Effect.acquireRelease(setCurrentProject(projectId), (project, exit) =>
      Exit.isFailure(exit) ? setPreviousProject(project) : Effect.void
    )
  })
