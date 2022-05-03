import { init } from 'raspi'
import { DigitalOutput, HIGH, LOW, PULL_DOWN } from 'raspi-gpio'

import { Config } from '../../types'

const PULSE_PIN = 'GPIO17'
const DIRECTION_PIN = 'GPIO27'
const ENABLE_PIN = 'GPIO22'

export function createMotorCommandHandler(config: Config) {
  const { charsPerLine, newlineRotationDegrees } = config

  return async (degrees: number) => {
    return new Promise<void>((resolve, reject) => {
      init(() => {
        const pullResistor = PULL_DOWN

        const pulse = new DigitalOutput({ pin: PULSE_PIN })
        const enable = new DigitalOutput({ pin: ENABLE_PIN })
        const direction = new DigitalOutput({
          pin: DIRECTION_PIN })

        pulse.write(HIGH)
        enable.write(HIGH)
        direction.write(HIGH)

        setTimeout(() => {
          pulse.write(LOW)
          enable.write(LOW)
          direction.write(LOW)

          resolve()
        }, 1000)
      })
    })
  }
}
