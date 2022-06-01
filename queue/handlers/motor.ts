import pigpio, { Gpio } from 'pigpio'

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
  edge: Gpio.EITHER_EDGE,
})

CONTROL_1.digitalWrite(LOW)
CONTROL_2.digitalWrite(LOW)
ENABLE.digitalWrite(LOW)

function generateWave() {
  pigpio.waveClear()

  // TODO: The following logic can be hard-coded t0 one direction.
  const clockwise = true
  const pin1 = clockwise ? CONTROL_PIN_1 : CONTROL_PIN_2
  const pin2 = clockwise ? CONTROL_PIN_2 : CONTROL_PIN_1
  const usDelay = 50

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
        ENABLE.digitalWrite(LOW)
        resolve()
      })
    })
  }
}
