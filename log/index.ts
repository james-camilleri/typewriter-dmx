import { emitter } from '../events/index.js'

const LOG_LEVEL = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
} as const
type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL]

const cache = []

function _log(level: LogLevel, ...args: any[]) {
  const log = `[${level}] ${args.join(' ')}`

  cache.push(log)
  console.log(log)
  emitter.fireEvent('log', log)
}

export function flushCache() {
  cache.forEach((log) => emitter.fireEvent('log', log))
}

export const log = {
  error: (...args: any[]) => _log(LOG_LEVEL.ERROR, ...args),
  warning: (...args: any[]) => _log(LOG_LEVEL.WARNING, ...args),
  info: (...args: any[]) => _log(LOG_LEVEL.INFO, ...args),
}
