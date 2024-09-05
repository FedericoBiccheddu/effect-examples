import * as crypto from 'crypto'
import { execSync } from 'child_process'
import { Effect, Exit, Context, Layer, Data } from 'effect'

export class CreateProjectError extends Data.TaggedError('CreateProjectError')<{
  readonly message: string
}> {}

export interface Project {
  readonly id: string
  readonly name?: string
}

export class CreateProject extends Context.Tag('CreateProject')<
  CreateProject,
  {
    readonly createProject: (
      projectName: string,
      folderId: string
    ) => Effect.Effect<Project, CreateProjectError>
    readonly deleteProject: (project: Project) => Effect.Effect<void>
  }
>() {
  static Live = Layer.sync(CreateProject, () => {
    return {
      createProject: (projectName, folderId) =>
        Effect.gen(function* () {
          yield* Effect.log(`[CreateProject] Creating "${projectName}" project`)

          const projectId = `${projectName}-${crypto.randomBytes(3).toString('hex')}`

          yield* Effect.try({
            try: () =>
              execSync(
                `gcloud projects create ${projectId} --name ${projectName} --folder ${folderId} --format json`
              ),
            catch: () => new CreateProjectError({ message: 'Failed to create project' }),
          })

          yield* Effect.log(`[CreateProject] Created "${projectName}" project`)

          return { id: projectId, name: projectName }
        }),

      deleteProject: (project) =>
        Effect.sync(() => execSync(`gcloud projects delete ${project.id}`)).pipe(
          Effect.tap(() => Effect.log(`[CreateProject] Deleted project "${project.name}"`))
        ),
    }
  })
}

export const createProject = (projectName: string, folderId: string) =>
  Effect.gen(function* () {
    const { createProject, deleteProject } = yield* CreateProject
    return yield* Effect.acquireRelease(createProject(projectName, folderId), (project, exit) =>
      Exit.isFailure(exit) ? deleteProject(project) : Effect.void
    )
  })
