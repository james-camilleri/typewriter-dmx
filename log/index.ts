import { emitter } from '../events/index.js'

const LOG_LEVEL = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
} as const
type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL]

function _log(level: LogLevel, ...args: any[]) {
  console.log(`[${level}] `, ...args)
  emitter.fireEvent('log', `[${level}] ${args.join(' ')}`)
}

export const log = {
  error: (...args: any[]) => _log(LOG_LEVEL.ERROR, ...args),
  warning: (...args: any[]) => _log(LOG_LEVEL.WARNING, ...args),
  info: (...args: any[]) => _log(LOG_LEVEL.INFO, ...args),
}
