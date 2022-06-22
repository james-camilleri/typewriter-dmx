import { Gpio } from 'pigpio-mock'

import { Emitter } from './index.js'

const LOW = 0
const HIGH = 1

// The number of microseconds it takes sound to travel 1cm at 20 degrees celsius
const MICROSECONDS_PER_CM = 1e6 / 34321
const TRIGGER_DISTANCE_CM = 70
const MINIMUM_TRIGGER_TIME = 2 * 1000 // milliseconds
const PULSE_INTERVAL = 500

// TODO: Set actual pins.
const TRIGGER_PIN = 20
const ECHO_PIN = 21

export default {
  initialise(emitter: Emitter) {
    const TRIGGER = new Gpio(TRIGGER_PIN, { mode: Gpio.OUTPUT })
    const ECHO = new Gpio(ECHO_PIN, {
      mode: Gpio.INPUT,
      alert: true,
      pullUpDown: Gpio.PUD_DOWN,
    })

    let startTick
    let detectionTime

    TRIGGER.digitalWrite(LOW)
    ECHO.on('alert', (level, tick) => {
      if (level == HIGH) {
        startTick = tick
      } else {
        const endTick = tick

        // Unsigned 32 bit arithmetic
        // https://github.com/fivdi/pigpio/blob/master/doc/gpio.md#events-1
        const diff = (endTick >> 0) - (startTick >> 0)

        // Divide by 2 because of round-trip to target.
        const distanceCm = diff / 2 / MICROSECONDS_PER_CM

        console.log(distanceCm)

        if (distanceCm <= TRIGGER_DISTANCE_CM) {
          detectionTime = detectionTime ?? Date.now()
          if (Date.now() - detectionTime >= MINIMUM_TRIGGER_TIME) {
            emitter.fireEvent('audience-detected')

            // Set to maximum possible value to avoid firing events
            // until the sensor "resets" after the audience member moves.
            detectionTime = Number.MAX_VALUE
          }

          return
        }

        detectionTime = null
      }
    })

    setInterval(
      () => TRIGGER.trigger(10 /* 10 microseconds */, HIGH),
      PULSE_INTERVAL,
    )
  },
}
