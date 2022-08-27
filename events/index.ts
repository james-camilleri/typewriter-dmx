import { log } from '../log/index.js'
import ButtonEvent from './button.js'
import ProximityEvent from './proximity.js'

type EventHandler = (type: string, payload?: any) => void

export interface Emitter {
  onEvent: (EventHandler) => void
  fireEvent: (type: string, payload?: any) => void
}

const handlers: EventHandler[] = []

export const emitter: Emitter = {
  onEvent(handler: EventHandler) {
    handlers.push(handler)
  },

  fireEvent(type: string, payload?: any) {
    log.info(`Event fired: "${type}"`)
    handlers.forEach((handler) => handler(type, payload))
  },
}

ButtonEvent.initialise(emitter)
ProximityEvent.initialise(emitter)
