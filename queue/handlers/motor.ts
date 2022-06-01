import pigpio, { Gpio } from 'pigpio'

import { Config } from '../../types'
import { MotorData } from '../commands'

const LOW = 0
const HIGH = 1

const CONTROL_PIN_1 = 17
const CONTROL_PIN_2 = 27
const ENABLE_PIN = 22
const SWITCH_PIN = 26

const CONTROL_1 = new Gpio(CONTROL_PIN_1, { mode: Gpio.OUTPUT })
const CONTROL_2 = new Gpio(CONTROL_PIN_2, { mode: Gpio.OUTPUT })
const ENABLE = new Gpio(ENABLE_PIN, { mode: Gpio.OUTPUT })
const SWITCH = new Gpio(SWITCH_PIN, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
})

CONTROL_1.digitalWrite(LOW)
CONTROL_2.digitalWrite(LOW)
ENABLE.digitalWrite(LOW)

SWITCH.on('interrupt', (level => {
  console.log('switch level is', level)
}))

function getLoopParams(steps: number) {
  const by1 = steps % 256
  const by256 = Math.floor(steps / 256)

  return [by1, by256]
}

export function createMotorCommandHandler(config: Config) {
  const { delaySlow, delayFast } = config

  const MICROSECOND_DELAY_SLOW = delaySlow ?? 200
  const MICROSECOND_DELAY_FAST = delayFast ?? 50

  return async ({ steps, hold, speed = 'slow' }: MotorData) => {
    return new Promise<void>((resolve, reject) => {
      pigpio.waveClear()
      ENABLE.digitalWrite(HIGH)

      const usDelay =
        speed === 'slow' ? MICROSECOND_DELAY_SLOW : MICROSECOND_DELAY_FAST

      const clockwise = steps >= 0
      const pin1 = clockwise ? CONTROL_PIN_1 : CONTROL_PIN_2
      const pin2 = clockwise ? CONTROL_PIN_2 : CONTROL_PIN_1

      pigpio.waveAddGeneric([
        { gpioOn: 0, gpioOff: pin1, usDelay },
        { gpioOn: pin1, gpioOff: 0, usDelay },
        { gpioOn: pin1, gpioOff: 0, usDelay },
        { gpioOn: 0, gpioOff: pin1, usDelay },
      ])

      pigpio.waveAddGeneric([
        { gpioOn: pin2, gpioOff: 0, usDelay },
        { gpioOn: pin2, gpioOff: 0, usDelay },
        { gpioOn: 0, gpioOff: pin2, usDelay },
        { gpioOn: 0, gpioOff: pin2, usDelay },
      ])

      const waveId = pigpio.waveCreate()

      if (waveId >= 0) {
        // Loop wave for `steps` amount.
        // See https://github.com/fivdi/pigpio/blob/master/doc/global.md#wavechainchain
        pigpio.waveChain([
          255,
          0,
          waveId,
          255,
          1,
          ...getLoopParams(Math.abs(steps)),
        ])
      }

      const lengthMicroseconds = pigpio.waveGetMicros() * Math.abs(steps)

      // Add 0.2ms safety gap per step.
      // Based off an approximate value of 1.5s for 8000 steps.
      const safetyGap = Math.max(0.2 * Math.abs(steps), 100)

      // I have no idea why it's currently taking twice as long as expected.
      const timeoutLength = (lengthMicroseconds / 1000) * 2 + safetyGap

      setTimeout(() => {
        if (!hold) ENABLE.digitalWrite(LOW)
        pigpio.waveDelete(waveId)
        resolve()
      }, timeoutLength)
    })
  }
}
