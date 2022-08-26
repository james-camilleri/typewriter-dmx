import { IUniverseDriver } from 'dmx-ts/dist/src/models/IUniverseDriver'

export interface Colour {
  r: number
  g: number
  b: number
}

export function createStatusLightCommandHandler(universe: IUniverseDriver) {
  const CHANNEL_R = 1
  const CHANNEL_G = 2
  const CHANNEL_B = 3

  return async ({ r, g, b }: Colour) => {
    universe.update({
      [CHANNEL_R]: r,
      [CHANNEL_G]: g,
      [CHANNEL_B]: b,
    })
  }
}
