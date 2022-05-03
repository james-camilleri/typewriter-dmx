import {
  IUniverseDriver,
  UniverseData,
} from 'dmx-ts/dist/src/models/IUniverseDriver'

function wiggle(value: number, wiggle: number) {
  const min = Math.floor(value * (1 - wiggle))
  const max = Math.floor(value * (1 + wiggle))
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function createCommandDmxHandler(universe: IUniverseDriver) {
  const KEYPRESS_TIME = 100
  const BASE_DELAY = 150
  const WIGGLE_PERCENTAGE = 0.2

  return async (dmxCommand: UniverseData) => {
    return new Promise<void>((resolve, reject) => {
      // Send initial command.
      console.log('sending dmx command', dmxCommand)
      universe.update(dmxCommand)

      // Reset DMX state after set delay.
      setTimeout(() => {
        universe.updateAll(0)

        // End command after random pause.
        setTimeout(() => resolve(), wiggle(BASE_DELAY, WIGGLE_PERCENTAGE))
      }, KEYPRESS_TIME)
    })
  }
}
