import * as path from 'path'
import { execSync } from 'child_process'
import { Effect, Exit, Context, Layer } from 'effect'
import { FailureCase } from '../shared'

export class CreateBucketError {
  readonly _tag = 'CreateBucketError'
}

export interface Bucket {
  readonly uri: string
}

export class CreateBucket extends Context.Tag('CreateBucket')<
  CreateBucket,
  {
    readonly createBucket: (
      bucketName: string,
      projectId: string
    ) => Effect.Effect<Bucket, CreateBucketError>
    readonly deleteBucket: (bucket: Bucket) => Effect.Effect<void>
  }
>() {
  static Live = Layer.effect(
    CreateBucket,
    Effect.gen(function* () {
      const failureCase = yield* FailureCase

      return {
        createBucket: (bucketName: string, projectId: string) =>
          Effect.gen(function* () {
            yield* Effect.log('[CreateBucket] creating bucket')

            const bucketUri = `gs://${bucketName}`

            yield* Effect.sync(() =>
              execSync(`gcloud storage buckets create ${bucketUri} --project ${projectId}`)
            )

            yield* Effect.sync(() => {
              execSync(`gsutil versioning set on ${bucketUri}`)
            })

            yield* Effect.sync(() => {
              execSync(`gsutil uniformbucketlevelaccess set on ${bucketUri}`)
            })

            yield* Effect.sync(() => {
              execSync(`gsutil bucketpolicyonly set on ${bucketUri}`)
            })

            const lifecycleJsonPath = yield* Effect.sync(() =>
              path.resolve(__dirname, 'lifecycle.json')
            )

            yield* Effect.sync(() =>
              execSync(`gsutil lifecycle set ${lifecycleJsonPath} ${bucketUri}`)
            )

            if (failureCase === 'CreateBucket') {
              return yield* Effect.fail(new CreateBucketError())
            } else {
              return { uri: bucketUri }
            }
          }),

        deleteBucket: (bucket) =>
          Effect.sync(() => execSync(`gcloud storage buckets delete ${bucket.uri}`)),
      }
    })
  )
}

export const createBucket = (bucketName: string, projectId: string) =>
  Effect.gen(function* () {
    const { createBucket, deleteBucket } = yield* CreateBucket
    return yield* Effect.acquireRelease(createBucket(bucketName, projectId), (bucket, exit) =>
      Exit.isFailure(exit) ? deleteBucket(bucket) : Effect.void
    )
  })
