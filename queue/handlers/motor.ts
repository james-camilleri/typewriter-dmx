import pigpio, { Gpio } from 'pigpio'

import { Config } from '../../types'

const LOW = 0
const HIGH = 1

const MICROSECOND_DELAY_SLOW = 500
const MICROSECOND_DELAY_FAST = 50

const CONTROL_PIN_1 = 17
const CONTROL_PIN_2 = 27
const ENABLE_PIN = 22

const CONTROL_1 = new Gpio(CONTROL_PIN_1, { mode: Gpio.OUTPUT })
const CONTROL_2 = new Gpio(CONTROL_PIN_2, { mode: Gpio.OUTPUT })
const ENABLE = new Gpio(ENABLE_PIN, { mode: Gpio.OUTPUT })

CONTROL_1.digitalWrite(LOW)
CONTROL_1.digitalWrite(LOW)
ENABLE.digitalWrite(LOW)

function getLoopParams(steps: number | string) {
  const repetitions = typeof steps === 'number' ? steps : Number(steps)
  const by1 = repetitions % 256
  const by256 = Math.floor(repetitions / 256)
  
  console.log('loops', [by1, by256])
  return [by1, by256]
}

export function createMotorCommandHandler(config: Config) {
  const { charsPerLine, newlineRotationDegrees } = config

  return async ({ steps, speed = 'slow' }: { steps: number, speed: 'slow' | 'fast' }) => {
    return new Promise<void>((resolve, reject) => {
      pigpio.waveClear()
      ENABLE.digitalWrite(HIGH)
      
      const usDelay = speed === 'slow'
        ? MICROSECOND_DELAY_SLOW
        : MICROSECOND_DELAY_FAST
        
      const clockwise = steps > 0
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
          255, 0,
          waveId,
          255, 1, ...getLoopParams(steps)
        ])
      }
      
      // TODO: figure out how to detect wave end.
      console.log('length in micros', pigpio.waveGetMicros())
      const length = pigpio.waveGetMicros() * Number(steps)
      console.log('full length in micros', length)
      console.log('length in seconds', length / 1000 / 1000)
      
      const timeoutLength = (length / 1000) * 2 + 1500

      setTimeout(() => {
        // STAHP.
        ENABLE.digitalWrite(LOW)
        pigpio.waveDelete(waveId)
        resolve()
      }, timeoutLength)
    })
  }
}
