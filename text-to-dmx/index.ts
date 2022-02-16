import { UniverseData } from 'dmx-ts/dist/src/models/IUniverseDriver'

import { KEYMAP } from './keymap.js'

const HIGH = 255

function isUppercase(char: string): boolean {
  return char.toUpperCase() === char
}

export function textToDmx(text: string): UniverseData[] {
  const characters = text.split('')

  return characters
    .map(character => {
      const channel = KEYMAP[character]

      if (channel && typeof channel === 'number') return { [channel]: HIGH }

      if (channel && Array.isArray(channel)) {
        return channel.reduce(
          (universeData, channel) => ({ ...universeData, [channel]: HIGH }),
          {},
        )
      }

      if (isUppercase(character)) {
        return { [KEYMAP.SHIFT]: HIGH, [KEYMAP[character]]: HIGH }
      }
    })
    .filter(Boolean)
}
