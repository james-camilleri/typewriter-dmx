import { Gpio } from 'pigpio'

const LOW = 0
const HIGH = 1

export enum RELAYS {
  RELAY_1 = 'RELAY_1',
  RELAY_2 = 'RELAY_2',
  RELAY_3 = 'RELAY_3',
  RELAY_4 = 'RELAY_4',
}

export type RelayCommand = { [key in RELAYS]?: boolean }

const RELAY_1_PIN = 19
const RELAY_2_PIN = 13
const RELAY_3_PIN = 6
const RELAY_4_PIN = 5

const RELAY_IO = {
  [RELAYS.RELAY_1]: new Gpio(RELAY_1_PIN, { mode: Gpio.OUTPUT }),
  [RELAYS.RELAY_2]: new Gpio(RELAY_2_PIN, { mode: Gpio.OUTPUT }),
  [RELAYS.RELAY_3]: new Gpio(RELAY_3_PIN, { mode: Gpio.OUTPUT }),
  [RELAYS.RELAY_4]: new Gpio(RELAY_4_PIN, { mode: Gpio.OUTPUT }),
} as const

RELAY_IO.RELAY_1.digitalWrite(LOW)
RELAY_IO.RELAY_2.digitalWrite(LOW)
RELAY_IO.RELAY_3.digitalWrite(LOW)
RELAY_IO.RELAY_4.digitalWrite(LOW)

export function createRelayCommandHandler() {
  return async (relayCommand: RelayCommand) =>
    new Promise<void>((resolve, _) => {
      Object.entries(relayCommand).forEach(([relay, on]) => {
        RELAY_IO[relay].digitalWrite(on ? HIGH : LOW)
      })

      resolve()
    })
}
