import { execSync } from 'child_process'
import { Effect, Context, Layer } from 'effect'

import { FailureCase } from '../shared'

export class LinkBillingAccountError {
  readonly _tag = 'LinkBillingAccountError'
}

export class LinkBillingAccount extends Context.Tag('LinkBillingAccount')<
  LinkBillingAccount,
  {
    readonly linkBillingAccount: (
      projectId: string,
      billingAccountId: string
    ) => Effect.Effect<void, LinkBillingAccountError>
  }
>() {
  static Live = Layer.effect(
    LinkBillingAccount,
    Effect.gen(function* () {
      const failureCase = yield* FailureCase
      return {
        linkBillingAccount: (projectId: string, billingAccountId: string) =>
          Effect.gen(function* () {
            yield* Effect.log(
              `[LinkBillingAccount] Linking billing account "${billingAccountId}" to project "${projectId}"`
            )

            yield* Effect.sync(() =>
              execSync(
                `gcloud beta billing projects link ${projectId} --billing-account ${billingAccountId}`
              )
            )

            if (failureCase === 'LinkBillingAccount') {
              return yield* Effect.fail(new LinkBillingAccountError())
            } else {
              return Effect.void
            }
          }),
      }
    })
  )
}

export const linkBillingAccount = (projectId: string, billingAccountId: string) =>
  Effect.gen(function* () {
    const { linkBillingAccount } = yield* LinkBillingAccount
    yield* linkBillingAccount(projectId, billingAccountId)
  })
