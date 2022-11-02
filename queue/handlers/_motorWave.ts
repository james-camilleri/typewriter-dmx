import pigpio, { Gpio, waveTxBusy } from 'pigpio'

const LOW = 0
const HIGH = 1

const CONTROL_PIN_1 = 17
const CONTROL_PIN_2 = 27
const ENABLE_PIN = 22

const CONTROL_1 = new Gpio(CONTROL_PIN_1, { mode: Gpio.OUTPUT })
const CONTROL_2 = new Gpio(CONTROL_PIN_2, { mode: Gpio.OUTPUT })
const ENABLE = new Gpio(ENABLE_PIN, { mode: Gpio.OUTPUT })

CONTROL_1.digitalWrite(LOW)
CONTROL_2.digitalWrite(LOW)
ENABLE.digitalWrite(LOW)

export function generateWave(
  direction: 'forwards' | 'backwards' = 'forwards',
  repeat?: number,
) {
  pigpio.waveClear()

  const usDelay = 50
  const pin1 = direction === 'forwards' ? CONTROL_PIN_1 : CONTROL_PIN_2
  const pin2 = direction === 'forwards' ? CONTROL_PIN_2 : CONTROL_PIN_1

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
    // Looping instructions.
    // See https://github.com/fivdi/pigpio/blob/master/doc/global.md#wavechainchain
    const loop = repeat
      ? [255, 0, waveId, 255, 1, repeat % 256, Math.floor(repeat % 256)] // Loop for *repeat* times
      : [255, 0, waveId, 255, 3] // Loop forever

    ENABLE.digitalWrite(HIGH)
    pigpio.waveChain(loop)

    if (repeat) {
      // This is blocking and very ugly,
      // but we need to present tomorrow morning.
      while (waveTxBusy()) {}
      ENABLE.digitalWrite(LOW)
    }

    return () => {
      ENABLE.digitalWrite(LOW)
    }
  }
}
