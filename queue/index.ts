import { emitter } from '../events/index.js'
import { log } from '../log/index.js'
import { COMMANDS, Command, CommandHandler } from './commands'

const queue: Command[] = []
const handlers: Partial<{ [key in COMMANDS]: CommandHandler }> = {}

export function registerHandler(
  commandType: COMMANDS,
  handler: CommandHandler,
) {
  handlers[commandType] = handler
}

export function executeCommand(...command: Command[]) {
  command.forEach(execute)
}

export function queueCommand(...command: Command[]) {
  const queueEmpty = queue.length === 0
  queue.push(...command)

  if (queueEmpty) executeNextCommand()
}

async function execute(command: Command) {
  const handler = handlers[command.type]
  if (!handler) {
    log.error(`Invalid command type "${command.type}".`)

    return
  }

  try {
    await handler(command.data)
  } catch (e) {
    log.error(`Error executing command "${command.type}".`)
    log.info('Command data:', command.data)
    log.info(e)
  }
}

async function executeNextCommand() {
  const command = queue.shift()
  if (!command) {
    emitter.fireEvent('queue-empty')
    return
  }

  await execute(command)
  executeNextCommand()
}
