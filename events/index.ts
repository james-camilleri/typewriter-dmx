import { log } from '../log/index.js'
import ButtonEvent from './button.js'
import ProximityEvent from './proximity.js'

type EventHandler = (type: string, payload?: any) => void

export interface Emitter {
  onEvent: (EventHandler) => void
  removeHandler: (EventHandler) => void
  fireEvent: (type: string, payload?: any) => void
}

let handlers: EventHandler[] = []

export const emitter: Emitter = {
  onEvent(handler: EventHandler) {
    handlers.push(handler)
  },

  removeHandler(handlerToRemove: EventHandler) {
    handlers = handlers.filter((handler) => handler !== handlerToRemove)
  },

  fireEvent(type: string, payload?: any) {
    if (type !== 'log') {
      log.info(`Event fired (typewriter): "${type}"`)
    }

    handlers.forEach((handler) => handler(type, payload))
  },
}

ButtonEvent.initialise(emitter)
ProximityEvent.initialise(emitter)
