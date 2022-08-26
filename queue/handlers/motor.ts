import pigpio, { Gpio } from 'pigpio'

const LOW = 0
const HIGH = 1

const CONTROL_PIN_1 = 17
const CONTROL_PIN_2 = 27
const ENABLE_PIN = 22
const SWITCH_PIN = 4

const CONTROL_1 = new Gpio(CONTROL_PIN_1, { mode: Gpio.OUTPUT })
const CONTROL_2 = new Gpio(CONTROL_PIN_2, { mode: Gpio.OUTPUT })
const ENABLE = new Gpio(ENABLE_PIN, { mode: Gpio.OUTPUT })
const SWITCH = new Gpio(SWITCH_PIN, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  edge: Gpio.EITHER_EDGE,
})

CONTROL_1.digitalWrite(LOW)
CONTROL_2.digitalWrite(LOW)
ENABLE.digitalWrite(LOW)

function generateWave() {
  pigpio.waveClear()

  const usDelay = 50

  pigpio.waveAddGeneric([
    { gpioOn: 0, gpioOff: CONTROL_PIN_1, usDelay },
    { gpioOn: CONTROL_PIN_1, gpioOff: 0, usDelay },
    { gpioOn: CONTROL_PIN_1, gpioOff: 0, usDelay },
    { gpioOn: 0, gpioOff: CONTROL_PIN_1, usDelay },
  ])

  pigpio.waveAddGeneric([
    { gpioOn: CONTROL_PIN_2, gpioOff: 0, usDelay },
    { gpioOn: CONTROL_PIN_2, gpioOff: 0, usDelay },
    { gpioOn: 0, gpioOff: CONTROL_PIN_2, usDelay },
    { gpioOn: 0, gpioOff: CONTROL_PIN_2, usDelay },
  ])

  const waveId = pigpio.waveCreate()

  if (waveId >= 0) {
    // Loop wave forever.
    // See https://github.com/fivdi/pigpio/blob/master/doc/global.md#wavechainchain
    pigpio.waveChain([255, 0, waveId, 255, 3])
  }
}

export function createMotorCommandHandler() {
  generateWave()

  return async () => {
    return new Promise<void>((resolve, reject) => {
      ENABLE.digitalWrite(HIGH)

      SWITCH.once('interrupt', (level) => {
        setTimeout(() => {
          ENABLE.digitalWrite(LOW)
          resolve()
        }, 100) // Wait a wee bit, so the carriage doesn't stop pulling early.
      })
    })
  }
}
