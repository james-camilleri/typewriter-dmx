import { emitter } from '../events/index.js'
import { log } from '../log/index.js'
import { Command, CommandHandler, COMMANDS } from './commands'

const queue: Command[] = []
const handlers: Partial<{ [key in COMMANDS]: CommandHandler }> = {}

export function registerHandler(
  commandType: COMMANDS,
  handler: CommandHandler,
) {
  handlers[commandType] = handler
}

export function queueCommand(...command: Command[]) {
  const queueEmpty = queue.length === 0
  queue.push(...command)

  if (queueEmpty) execute()
}

async function execute() {
  const command = queue.shift()
  if (!command) {
    emitter.fireEvent('typing-complete')
    return
  }

  const handler = handlers[command.type]
  if (!handler) {
    log.error(`Invalid command type "${command.type}".`)
    execute()

    return
  }

  try {
    await handler(command.data)
  } catch (e) {
    log.error(`Error executing command "${command.type}".`)
    log.info('Command data:', command.data)
    log.info(e)
  }

  execute()
}
