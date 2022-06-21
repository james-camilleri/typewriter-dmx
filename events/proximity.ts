import { Emitter } from './index.js'

export default {
  initialise(emitter: Emitter) {
    // TODO: Replace with actual implementation.
    setInterval(() => emitter.fireEvent('audience-detected'), 3000)
  },
}
