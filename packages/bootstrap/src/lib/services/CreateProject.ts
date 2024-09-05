import * as crypto from 'crypto'
import { execSync } from 'child_process'
import { Effect, Exit, Context, Layer } from 'effect'

import { FailureCase } from '../shared'

export class CreateProjectError {
  readonly _tag = 'CreateProjectError'
}

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
  static Live = Layer.effect(
    CreateProject,
    Effect.gen(function* () {
      const failureCase = yield* FailureCase

      return {
        createProject: (projectName: string, folderId: string) =>
          Effect.gen(function* () {
            yield* Effect.log(`[CreateProject] Creating "${projectName}" project`)

            const projectId = `${projectName}-${crypto.randomBytes(3).toString('hex')}`

            yield* Effect.sync(() =>
              execSync(
                `gcloud projects create ${projectId} --name ${projectName} --folder ${folderId} --format json`
              )
            )

            if (failureCase === 'CreateProject') {
              return yield* Effect.fail(new CreateProjectError())
            } else {
              return { id: projectId, name: projectName }
            }
          }),

        deleteProject: (project) =>
          Effect.sync(() => execSync(`gcloud projects delete ${project.id}`)),
      }
    })
  )
}

export const createProject = (projectName: string, folderId: string) =>
  Effect.gen(function* () {
    const { createProject, deleteProject } = yield* CreateProject
    return yield* Effect.acquireRelease(createProject(projectName, folderId), (project, exit) =>
      Exit.isFailure(exit) ? deleteProject(project) : Effect.void
    )
  })
