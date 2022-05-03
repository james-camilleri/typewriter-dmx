import { init } from 'raspi'
import { DigitalOutput, HIGH, LOW, PULL_DOWN } from 'raspi-gpio'

import { Config } from '../../types'

const PULSE_PIN = 17
const DIRECTION_PIN = 27
const ENABLE_PIN = 22

export function createMotorCommandHandler(config: Config) {
  const { charsPerLine, newlineRotationDegrees } = config

  return async (degrees: number) => {
    return new Promise<void>((resolve, reject) => {
      init(() => {
        const pullResistor = PULL_DOWN

        const pulse = new DigitalOutput({ pin: PULSE_PIN, pullResistor })
        const enable = new DigitalOutput({ pin: ENABLE_PIN, pullResistor })
        const direction = new DigitalOutput({
          pin: DIRECTION_PIN,
          pullResistor,
        })

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
