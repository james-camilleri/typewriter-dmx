import { Animation } from 'dmx-ts'
import { IUniverseDriver } from 'dmx-ts/dist/src/models/IUniverseDriver'

export interface Colour {
  r: number
  g: number
  b: number
}

const CHANNEL_R = 1
const CHANNEL_G = 2
const CHANNEL_B = 3
const ANIMATION_DURATION = 300

export function createStatusLightCommandHandler(universe: IUniverseDriver) {
  return async ({ r, g, b }: Colour) => {
    new Animation()
      .add(
        {
          [CHANNEL_R]: r,
          [CHANNEL_G]: g,
          [CHANNEL_B]: b,
        },
        ANIMATION_DURATION,
      )
      .run(universe)
  }
}
