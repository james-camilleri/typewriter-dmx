import { Gpio } from 'pigpio'

import { Config } from '../../types'

const LOW = 0
const HIGH = 1

const PULSE_PIN = new Gpio(17, { mode: Gpio.OUTPUT })
const DIRECTION_PIN = new Gpio(27, { mode: Gpio.OUTPUT })
const ENABLE_PIN = new Gpio(22, { mode: Gpio.OUTPUT })

export function createMotorCommandHandler(config: Config) {
  const { charsPerLine, newlineRotationDegrees } = config

  return async (amount: number) => {
    return new Promise<void>((resolve, reject) => {

      // TODO: This is definitely wrong and moves weird.
      PULSE_PIN.servoWrite(amount)
      DIRECTION_PIN.digitalWrite(HIGH)
      ENABLE_PIN.digitalWrite(HIGH)

      setTimeout(() => {
        ENABLE_PIN.digitalWrite(LOW)
        resolve()
      }, 5000)
    })
  }
}
