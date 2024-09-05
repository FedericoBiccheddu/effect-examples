import { execSync } from 'child_process'
import { Effect, Context, Layer, Data, Redacted } from 'effect'

export class LinkBillingAccountError extends Data.TaggedError('LinkBillingAccountError')<{
  readonly message: string
}> {}

export class LinkBillingAccount extends Context.Tag('LinkBillingAccount')<
  LinkBillingAccount,
  {
    readonly linkBillingAccount: (
      projectId: string,
      billingAccountId: Redacted.Redacted<string>
    ) => Effect.Effect<void, LinkBillingAccountError>
  }
>() {
  static Live = Layer.sync(LinkBillingAccount, () => {
    return {
      linkBillingAccount: (projectId, billingAccountId) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `[LinkBillingAccount] Linking billing account "${billingAccountId}" to project "${projectId}"`
          )

          const billingId = Redacted.value(billingAccountId)

          yield* Effect.try({
            try: () =>
              execSync(
                `gcloud beta billing projects link ${projectId} --billing-account ${billingId}`
              ),
            catch: () =>
              new LinkBillingAccountError({
                message: 'Failed to link billing account',
              }),
          })

          yield* Effect.log(
            `[LinkBillingAccount] Linked billing account "${billingAccountId}" to project "${projectId}"`
          )
        }),
    }
  })
}

export const linkBillingAccount = (
  projectId: string,
  billingAccountId: Redacted.Redacted<string>
) =>
  Effect.gen(function* () {
    const { linkBillingAccount } = yield* LinkBillingAccount
    yield* linkBillingAccount(projectId, billingAccountId)
  })
