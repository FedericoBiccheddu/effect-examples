import { execSync } from 'child_process'
import { Effect, Exit, Context, Layer, Data } from 'effect'

import { Project } from './CreateProject'

export class SetQuotaProjectError extends Data.TaggedError('SetQuotaProjectError')<{
  readonly message: string
}> {}

export class SetQuotaProject extends Context.Tag('SetQuotaProject')<
  SetQuotaProject,
  {
    readonly setQuotaProject: (projectId: string) => Effect.Effect<Project, SetQuotaProjectError>
    readonly setPreviousQuotaProject: (project: Project) => Effect.Effect<void>
  }
>() {
  static Live = Layer.sync(SetQuotaProject, () => {
    return {
      setQuotaProject: (projectId: string) =>
        Effect.gen(function* () {
          yield* Effect.log(`[SetQuotaProject] Setting quota project for project "${projectId}"`)

          const currentProjectId = yield* Effect.try({
            try: () => execSync('gcloud config get-value project').toString().trim(),
            catch: () => new SetQuotaProjectError({ message: 'Failed to get current project id' }),
          })

          yield* Effect.try({
            try: () => execSync(`gcloud auth application-default set-quota-project ${projectId}`),
            catch: () => new SetQuotaProjectError({ message: 'Failed to set quota project' }),
          })

          return { id: currentProjectId }
        }),

      setPreviousQuotaProject: (project) =>
        Effect.sync(() =>
          execSync(`gcloud auth application-default set-quota-project ${project.id}`)
        ),
    }
  })
}

export const setQuotaProject = (projectId: string) =>
  Effect.gen(function* () {
    const { setQuotaProject, setPreviousQuotaProject } = yield* SetQuotaProject
    return yield* Effect.acquireRelease(setQuotaProject(projectId), (project, exit) =>
      Exit.isFailure(exit) ? setPreviousQuotaProject(project) : Effect.void
    )
  })
