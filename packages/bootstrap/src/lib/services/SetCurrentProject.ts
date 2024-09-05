import { execSync } from 'child_process'
import { Context, Data, Effect, Exit, Layer } from 'effect'

import { Project } from './CreateProject'

export class GetCurrentProjectError extends Data.TaggedError('GetCurrentProjectError')<{
  message: string
}> {}

export class SetCurrentProjectError extends Data.TaggedError('SetCurrentProjectError')<{
  message: string
}> {}

export class SetCurrentProject extends Context.Tag('SetCurrentProject')<
  SetCurrentProject,
  {
    readonly setCurrentProject: (
      projectId: string
    ) => Effect.Effect<Project, GetCurrentProjectError | SetCurrentProjectError>
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
              new GetCurrentProjectError({ message: 'Failed to get current project id' }),
          })

          yield* Effect.try({
            try: () => execSync(`gcloud config set project ${projectId}`),
            catch: () => new SetCurrentProjectError({ message: 'Failed to set quota project' }),
          })

          return { id: currentProjectId }
        }),

      setPreviousProject: (project) =>
        Effect.sync(() => execSync(`gcloud config set project ${project.id}`)),
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
