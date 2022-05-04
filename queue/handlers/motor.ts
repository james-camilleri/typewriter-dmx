import pigpio, { Gpio } from 'pigpio'

import { Config } from '../../types'

const LOW = 0
const HIGH = 1

const MICROSECOND_DELAY = 1000

const PULSE_PIN = 17
const DIRECTION_PIN = 27
const ENABLE_PIN = 22

const PULSE = new Gpio(PULSE_PIN, { mode: Gpio.OUTPUT })
const DIRECTION = new Gpio(DIRECTION_PIN, { mode: Gpio.OUTPUT })
const ENABLE = new Gpio(ENABLE_PIN, { mode: Gpio.OUTPUT })

PULSE.digitalWrite(LOW)
DIRECTION.digitalWrite(LOW)
ENABLE.digitalWrite(HIGH)

export function createMotorCommandHandler(config: Config) {
  const { charsPerLine, newlineRotationDegrees } = config

  return async (amount: number) => {
    return new Promise<void>((resolve, reject) => {
      pigpio.waveClear()

      // First control pin.
      pigpio.waveAddGeneric([
        { gpioOn: 0, gpioOff: PULSE_PIN, usDelay: MICROSECOND_DELAY },
        { gpioOn: PULSE_PIN, gpioOff: 0, usDelay: MICROSECOND_DELAY },
        { gpioOn: PULSE_PIN, gpioOff: 0, usDelay: MICROSECOND_DELAY },
        { gpioOn: 0, gpioOff: PULSE_PIN, usDelay: MICROSECOND_DELAY },
      ])

      // Second control pin.
      pigpio.waveAddGeneric([
        { gpioOn: DIRECTION_PIN, gpioOff: 0, usDelay: MICROSECOND_DELAY },
        { gpioOn: DIRECTION_PIN, gpioOff: 0, usDelay: MICROSECOND_DELAY },
        { gpioOn: 0, gpioOff: DIRECTION_PIN, usDelay: MICROSECOND_DELAY },
        { gpioOn: 0, gpioOff: DIRECTION_PIN, usDelay: MICROSECOND_DELAY },
      ])

      const waveId = pigpio.waveCreate()

      if (waveId >= 0) {
        pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_REPEAT)
      }

      setTimeout(() => {
        // STAHP.
        resolve()
      }, 5000)
    })
  }
}
