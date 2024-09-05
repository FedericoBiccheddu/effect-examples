import { execSync } from 'child_process'
import { Context, Data, Effect, Exit, Layer } from 'effect'

import { Project } from './CreateProject'

export class SetCurrentProjectError extends Data.TaggedError('SetCurrentProjectError')<{
  message: string
}> {}

export class SetCurrentProject extends Context.Tag('SetCurrentProject')<
  SetCurrentProject,
  {
    readonly setCurrentProject: (
      projectId: string
    ) => Effect.Effect<Project, SetCurrentProjectError>
    readonly setPreviousProject: (project: Project) => Effect.Effect<void>
  }
>() {
  static Live = Layer.sync(SetCurrentProject, () => {
    return {
      setCurrentProject: (projectId: string) =>
        Effect.gen(function* () {
          yield* Effect.log(`[SetCurrentProject] Setting current project to "${projectId}"`)

          const currentProjectId = yield* Effect.try({
            try: () => execSync('gcloud config get-value project').toString().trim(),
            catch: () =>
              new SetCurrentProjectError({ message: 'Failed to get current project id' }),
          })

          yield* Effect.try({
            try: () => execSync(`gcloud config set project ${projectId}`),
            catch: () => new SetCurrentProjectError({ message: 'Failed to set quota project' }),
          })

          yield* Effect.log(
            `[SetCurrentProject] Set current project to "${projectId}" (previous: "${currentProjectId}")`
          )

          return { id: currentProjectId }
        }),

      setPreviousProject: (project) =>
        Effect.sync(() => execSync(`gcloud config set project ${project.id}`)).pipe(
          Effect.tap(() =>
            Effect.log(`[SetCurrentProject] Set current project back to "${project.id}"`)
          )
        ),
    }
  })
}

export const setCurrentProject = (projectId: string) =>
  Effect.gen(function* () {
    const { setCurrentProject, setPreviousProject } = yield* SetCurrentProject
    return yield* Effect.acquireRelease(setCurrentProject(projectId), (project, exit) =>
      Exit.isFailure(exit) ? setPreviousProject(project) : Effect.void
    )
  })
