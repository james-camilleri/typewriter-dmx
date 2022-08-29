import { Gpio } from 'pigpio'

import { Emitter } from './index.js'

const LOW = 0
const HIGH = 1

// The number of microseconds it takes sound to travel 1cm at 20 degrees celsius
const MICROSECONDS_PER_CM = 1e6 / 34321
const TRIGGER_DISTANCE_CM = 70
const PULSE_INTERVAL = 500

const TRIGGER_PIN = 20
const ECHO_PIN = 21

// Flag whether an audience member has been
// detected or not to debounce the messages.
let detected = false

export default {
  initialise(emitter: Emitter) {
    const TRIGGER = new Gpio(TRIGGER_PIN, { mode: Gpio.OUTPUT })
    const ECHO = new Gpio(ECHO_PIN, {
      mode: Gpio.INPUT,
      alert: true,
      pullUpDown: Gpio.PUD_DOWN,
    })

    let startTick

    TRIGGER.digitalWrite(LOW)
    ECHO.on('alert', (level, tick) => {
      if (level === HIGH) {
        startTick = tick
      } else {
        const endTick = tick

        // Unsigned 32 bit arithmetic
        // https://github.com/fivdi/pigpio/blob/master/doc/gpio.md#events-1
        const diff = (endTick >> 0) - (startTick >> 0)

        // Divide by 2 because of round-trip to target.
        const distanceCm = diff / 2 / MICROSECONDS_PER_CM

        if (distanceCm <= TRIGGER_DISTANCE_CM && !detected) {
          detected = true
          emitter.fireEvent('audience-detected')
        }

        if (distanceCm > TRIGGER_DISTANCE_CM) {
          detected = false
        }
      }
    })

    setInterval(
      () => TRIGGER.trigger(10 /* 10 microseconds */, HIGH),
      PULSE_INTERVAL,
    )
  },
}
