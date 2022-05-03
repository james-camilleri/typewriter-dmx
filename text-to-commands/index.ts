import { UniverseData } from 'dmx-ts/dist/src/models/IUniverseDriver'

import { COMMANDS } from '../queue/commands.js'
import { Config } from '../types'

const HIGH = 255

// TODO: Find a less ugly way to store the "global" config.
let CHARS_PER_LINE = 50
let NEWLINE_ROTATION_DEGREES = 0
let KEYMAP: { [key: string]: number | number[] } = {}

export function configure({
  charsPerLine,
  newlineRotationDegrees,
  keyMap,
}: Config) {
  CHARS_PER_LINE = charsPerLine
  NEWLINE_ROTATION_DEGREES = newlineRotationDegrees
  KEYMAP = keyMap
}

function isUppercase(char: string): boolean {
  return char.toUpperCase() === char
}

function splitLongLine(line: string) {
  if (line.length <= CHARS_PER_LINE) return line

  const words = line.split(' ')
  const lines: string[] = []

  let nextLine = []

  while (words.length > 0) {
    const nextWord = words.shift()
    const remainingChars = CHARS_PER_LINE - nextLine.join(' ').length

    if (remainingChars >= nextWord.length) {
      nextLine.push(nextWord)
    } else {
      lines.push(nextLine.join(' '))
      nextLine = [nextWord]
    }
  }

  return lines
}

function splitToLines(text: string) {
  return text.split('\n').map(splitLongLine).flat()
}

function charsToDmxData(text: string): UniverseData[] {
  const characters = text.split('')

  return characters
    .map(character => {
      const channel = KEYMAP[character]

      if (channel != null && typeof channel === 'number') {
        return { [channel]: HIGH }
      }

      if (channel != null && Array.isArray(channel)) {
        return channel.reduce(
          (universeData, channel) => ({ ...universeData, [channel]: HIGH }),
          {},
        )
      }

      if (isUppercase(character)) {
        // TODO: Figure out why this throws a type error.
        // @ts-expect-error
        return { [KEYMAP.SHIFT]: HIGH, [KEYMAP[character.toLowerCase()]]: HIGH }
      }
    })
    .filter(Boolean)
}

export function textToCommands(text: string) {
  const lines = splitToLines(text)
  const dmxCommandsByLine = lines
    .map(charsToDmxData)
    .map(dmxSequenceArray =>
      dmxSequenceArray.map(dmxData => ({ type: COMMANDS.DMX, data: dmxData })),
    )

  return dmxCommandsByLine
    .map(dmxCommands => [...dmxCommands, { type: COMMANDS.MOTOR, data: 0 }])
    .flat()
}
