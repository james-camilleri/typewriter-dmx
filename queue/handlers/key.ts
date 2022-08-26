import {
  IUniverseDriver,
  UniverseData,
} from 'dmx-ts/dist/src/models/IUniverseDriver'

// Channels before this are reserved for the status light.
const START_CHANNEL = 4

// Generate a chunk of channel numbers to reset.
const RESET_CHANNELS = Array(50)
  .fill(0)
  .map((_, i) => i + START_CHANNEL)

// Command to reset all the generated channels.
const RESET_COMMAND = RESET_CHANNELS.reduce(
  (command, channel) => ({
    ...command,
    [channel]: 0,
  }),
  {},
)

function wiggle(value: number, wiggle: number) {
  const min = Math.floor(value * (1 - wiggle))
  const max = Math.floor(value * (1 + wiggle))
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function createKeyCommandHandler(universe: IUniverseDriver) {
  const KEYPRESS_TIME = 100
  const BASE_DELAY = 150
  const WIGGLE_PERCENTAGE = 0.2

  return async (
    dmxCommand: UniverseData | { universeData: UniverseData; reset: boolean },
  ) => {
    return new Promise<void>((resolve, reject) => {
      // Send initial command.
      universe.update(dmxCommand['universeData'] ?? dmxCommand)

      // Reset DMX state after set delay.
      setTimeout(() => {
        if (dmxCommand['reset'] !== false) {
          universe.update(RESET_COMMAND)
        }

        // End command after random pause.
        setTimeout(() => resolve(), wiggle(BASE_DELAY, WIGGLE_PERCENTAGE))
      }, KEYPRESS_TIME)
    })
  }
}
