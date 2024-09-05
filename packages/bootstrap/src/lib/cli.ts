import { Prompt } from '@effect/cli'
import { Effect } from 'effect'

export type BootstrapArgs = {
  orgId: string
  billingAccountId: string
  folderName: string
  projectName: string
  bucketName: string
}

const orgId = Prompt.text({
  message: "What's the organization ID?",
  validate: (n) =>
    n.length > 0 ? Effect.succeed(n) : Effect.fail('Organization ID cannot be empty'),
})

const billingAccountId = Prompt.text({
  message: "What's the billing account ID?",
  validate: (n) =>
    n.length > 0 ? Effect.succeed(n) : Effect.fail('Billing account ID cannot be empty'),
})

const folderName = Prompt.text({
  message: "What's the name of the folder?",
  validate: (n) => (n.length > 0 ? Effect.succeed(n) : Effect.fail('Folder name cannot be empty')),
})

const projectName = Prompt.text({
  message: "What's the name of the project?",
  validate: (n) => (n.length > 0 ? Effect.succeed(n) : Effect.fail('Project name cannot be empty')),
})

const bucketName = Prompt.text({
  message: "What's the name of the bucket?",
  validate: (n) => (n.length > 0 ? Effect.succeed(n) : Effect.fail('Bucket name cannot be empty')),
})

const confirm = Prompt.confirm({
  message: 'Do you want to proceed?',
})

export const prompts = Prompt.all({
  orgId,
  billingAccountId,
  folderName,
  projectName,
  bucketName,
  confirm,
})
