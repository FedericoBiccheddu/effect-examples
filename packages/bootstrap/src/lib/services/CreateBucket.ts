import * as path from 'path'
import { execSync } from 'child_process'
import { Effect, Exit, Context, Layer, Data } from 'effect'

export class CreateBucketError extends Data.TaggedError('CreateBucketError')<{
  readonly message: string
}> {}

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
  static Live = Layer.sync(CreateBucket, () => {
    return {
      createBucket: (bucketName: string, projectId: string) =>
        Effect.gen(function* () {
          yield* Effect.log(`[CreateBucket] Creating bucket "${bucketName}"`)

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
            path.resolve(__dirname, '../json/lifecycle.json')
          )

          yield* Effect.sync(() =>
            execSync(`gsutil lifecycle set ${lifecycleJsonPath} ${bucketUri}`)
          )

          yield* Effect.log(`[CreateBucket] Created bucket "${bucketName}"`)

          return { uri: bucketUri }
        }),

      deleteBucket: (bucket) =>
        Effect.sync(() => execSync(`gcloud storage buckets delete ${bucket.uri}`)).pipe(
          Effect.tap(() => Effect.log(`[CreateBucket] Deleted bucket "${bucket.uri}"`))
        ),
    }
  })
}

export const createBucket = (bucketName: string, projectId: string) =>
  Effect.gen(function* () {
    const { createBucket, deleteBucket } = yield* CreateBucket
    return yield* Effect.acquireRelease(createBucket(bucketName, projectId), (bucket, exit) =>
      Exit.isFailure(exit) ? deleteBucket(bucket) : Effect.void
    )
  })
