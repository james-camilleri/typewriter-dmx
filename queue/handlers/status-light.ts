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
const ANIMATION_DURATION_SINGLE = 300
const ANIMATION_DURATION_PULSE = 500

let animation = new Animation()

export function createStatusLightCommandHandler(universe: IUniverseDriver) {
  return async (colours: Colour | Colour[]) => {
    animation.stop()
    animation = new Animation()

    const isPulse = Array.isArray(colours)
    const colourArray = isPulse ? colours : [colours]
    const duration = isPulse
      ? ANIMATION_DURATION_PULSE
      : ANIMATION_DURATION_SINGLE

    colourArray.forEach(({ r, g, b }) => {
      animation.add(
        {
          [CHANNEL_R]: r,
          [CHANNEL_G]: g,
          [CHANNEL_B]: b,
        },
        duration,
        { easing: 'inOutQuad' },
      )
    })

    animation[isPulse ? 'runLoop' : 'run'](universe)
  }
}
