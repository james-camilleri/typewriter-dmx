import { UniverseData } from 'dmx-ts/dist/src/models/IUniverseDriver'

import { COMMANDS } from '../queue/commands.js'
import { Config } from '../types'

const HIGH = 255
const MIN_LINE_LENGTH = 20

// TODO: Find a less ugly way to store the "global" config.
let CHARS_PER_LINE = 50
let CARRIAGE_RETURN_STEPS = 1000
let NEWLINE_RETURN_STEPS = 1000
let KEYMAP: { [key: string]: number } = {}

export function configure({
  charsPerLine,
  carriageReturnSteps,
  newlineRotationSteps,
  keyMap,
}: Config) {
  CHARS_PER_LINE = charsPerLine ?? CHARS_PER_LINE
  CARRIAGE_RETURN_STEPS = carriageReturnSteps ?? CARRIAGE_RETURN_STEPS
  NEWLINE_RETURN_STEPS = newlineRotationSteps ?? NEWLINE_RETURN_STEPS
  KEYMAP = keyMap ?? KEYMAP
}

function isUppercase(char: string): boolean {
  return char.toUpperCase() === char
}

export function splitLongLine(line: string) {
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

  // There will always be a remaining line that hasn't been added
  lines.push(nextLine.join(' '))

  return lines
}

function repeat(char: string, n: number) {
  return Array(n).fill(char).join('')
}

function padLine(line: string) {
  return line.length < MIN_LINE_LENGTH
    ? line + repeat(' ', MIN_LINE_LENGTH - line.length)
    : line
}

function splitToLines(text: string) {
  return text.split('\n').map(splitLongLine).flat().map(padLine)
}

function generateShiftSet(channelToShift: number) {
  const start = { universeData: { [KEYMAP.SHIFT]: HIGH }, reset: false }
  const combined = {
    universeData: { [KEYMAP.SHIFT]: HIGH, [channelToShift]: HIGH },
    reset: false,
  }
  const end = { [KEYMAP.SHIFT]: HIGH }

  return [start, combined, end]
}

function charsToDmxData(text: string): UniverseData[] {
  const characters = text.split('')

  return characters
    .map((character) => {
      const channel = KEYMAP[character]

      // Negative channel numbers signify a SHIFT,
      // until we have time to do something less abhorrent.
      if (channel != null && channel < 0) {
        return generateShiftSet(Math.abs(channel))
      }

      if (channel != null) {
        return { [channel]: HIGH }
      }

      if (isUppercase(character)) {
        return generateShiftSet(KEYMAP[character.toLowerCase()])
      }
    })
    .flat() // Flatten SHIFT sets.
    .filter(Boolean)
}

export function textToCommands(text: string) {
  const lines = splitToLines(text)
  const commandsByLine = lines.map(charsToDmxData).map((dmxSequenceArray) =>
    dmxSequenceArray.map((dmxData) => ({
      type: COMMANDS.KEY,
      data: dmxData,
    })),
  )

  return commandsByLine
    .map((commands) => [
      ...commands,
      // Add motor command to reverse carriage.
      { type: COMMANDS.MOTOR },
    ])
    .flat()
}
