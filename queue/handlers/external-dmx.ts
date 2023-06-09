import { Animation } from 'dmx-ts'
import { IUniverseDriver } from 'dmx-ts/dist/src/models/IUniverseDriver'
import { Colour } from './status-light'
import { log } from '../../log'

const DEFAULT_DURATION = 300

export function createExternalDmxHandler(universe: IUniverseDriver) {
  return async (data: {
    channel: number
    value: number | Colour
    transitionDuration?: number
  }) => {
    log.info('Executing external dmx command', data)
    const animation = new Animation()

    const duration = data.transitionDuration ?? DEFAULT_DURATION
    animation.add(
      isColour(data.value)
        ? {
            [data.channel]: data.value.r,
            [data.channel + 1]: data.value.g,
            [data.channel + 2]: data.value.b,
          }
        : {
            [data.channel]: data.value,
          },
      duration,
      { easing: 'outQuart' },
    )

    animation.run(universe)
  }
}

function isColour(data: Colour | any): data is Colour {
  return data && data.r != null && data.g != null && data.b != null
}
