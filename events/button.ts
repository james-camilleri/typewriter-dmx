import { Gpio } from 'pigpio'

import { Emitter } from './index.js'

const HIGH = 1
const BUTTON_PIN = 12

export default {
  initialise(emitter: Emitter) {
    const BUTTON = new Gpio(BUTTON_PIN, {
      mode: Gpio.INPUT,
      alert: true,
      pullUpDown: Gpio.PUD_DOWN,
    })

    // Debounce the button signal.
    BUTTON.glitchFilter(50000)

    BUTTON.on('alert', (level) => {
      emitter.fireEvent(level === HIGH ? 'button-down' : 'button-up')
    })
  },
}
