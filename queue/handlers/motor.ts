import { Gpio } from 'pigpio'

import { generateWave } from './_motorWave'

const SWITCH_PIN = 3

const SWITCH = new Gpio(SWITCH_PIN, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  edge: Gpio.EITHER_EDGE,
})

export function createMotorCommandHandler() {
  return async () => {
    return new Promise<void>((resolve, reject) => {
      const disableMotor = generateWave()

      SWITCH.once('interrupt', (level) => {
        setTimeout(() => {
          disableMotor()
          resolve()
        }, 100) // Wait a wee bit, so the carriage doesn't stop pulling early.
      })
    })
  }
}
