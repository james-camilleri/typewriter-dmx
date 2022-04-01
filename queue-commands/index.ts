import {
  IUniverseDriver,
  UniverseData,
} from 'dmx-ts/dist/src/models/IUniverseDriver'

function wiggle(value: number, wiggle: number) {
  const min = Math.floor(value * (1 - wiggle))
  const max = Math.floor(value * (1 + wiggle))
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function queueDmxUpdates(
  universe: IUniverseDriver,
  updates: UniverseData[],
) {
  const KEYPRESS_TIME = 100
  const BASE_DELAY = 150
  const WIGGLE_PERCENTAGE = 0.2

  let startTime = 0
  for (const update of updates) {
    setTimeout(() => universe.update(update), startTime)
    setTimeout(() => universe.updateAll(0), startTime + KEYPRESS_TIME)
    startTime += wiggle(BASE_DELAY, WIGGLE_PERCENTAGE)
  }
}
