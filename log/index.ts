import { emitter } from '../events/index.js'

const LOG_LEVEL = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
} as const
type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL]

let cache: string[] = []

function _log(level: LogLevel, ...args: any[]) {
  const log = `[${level}] ${args.join(' ')}`

  cache.push(log)
  console.log(log)
  emitter.fireEvent('log', log)
}

export function flushCache() {
  emitter.fireEvent(
    'log',
    '[DEBUG] Flushing cache ------------------------------',
  )

  cache.forEach((log) =>
    emitter.fireEvent(
      'log',
      log.replace(/\[(ERROR|WARNING|INFO)\]/, `[${LOG_LEVEL.DEBUG}]`),
    ),
  )

  emitter.fireEvent(
    'log',
    '[DEBUG] Flushed cache ------------------------------',
  )

  cache = []
}

export const log = {
  error: (...args: any[]) => _log(LOG_LEVEL.ERROR, ...args),
  warning: (...args: any[]) => _log(LOG_LEVEL.WARNING, ...args),
  info: (...args: any[]) => _log(LOG_LEVEL.INFO, ...args),
  debug: (...args: any[]) => _log(LOG_LEVEL.DEBUG, ...args),
}
