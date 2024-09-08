import * as NodeContext from '@effect/platform-node/NodeContext'
import * as Runtime from '@effect/platform-node/NodeRuntime'
import { Command } from '@effect/cli'
import { Effect } from 'effect'

import { prompts } from './lib/cli'
import { bootstrap } from './lib/bootstrap'

const command = Command.prompt('bootstrap', prompts, (args) =>
  args.confirm ? bootstrap(args) : Effect.logError('[Bootstrap] Operation cancelled')
)

const cli = Command.run(command, {
  name: 'Bootstrap',
  version: '0.0.1',
})

Effect.suspend(() => cli(process.argv)).pipe(Effect.provide(NodeContext.layer), Runtime.runMain)
