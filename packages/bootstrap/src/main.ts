import { Command } from '@effect/cli'
import * as NodeContext from '@effect/platform-node/NodeContext'
import * as Runtime from '@effect/platform-node/NodeRuntime'
import { Effect, Logger } from 'effect'

import { prompts } from './lib/cli'
import { bootstrap } from './lib/bootstrap'

const command = Command.prompt('bootstrap', prompts, (o) =>
  o.confirm ? bootstrap(o) : Effect.logError('Operation cancelled.')
)

const cli = Command.run(command, {
  name: 'GCP Bootstrap',
  version: '0.0.1',
})

Effect.suspend(() => cli(process.argv)).pipe(
  Effect.provide(Logger.pretty),
  Effect.provide(NodeContext.layer),
  Runtime.runMain
)
