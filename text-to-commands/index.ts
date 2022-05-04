import { UniverseData } from 'dmx-ts/dist/src/models/IUniverseDriver'

import { COMMANDS, Command } from '../queue/commands.js'
import { Config } from '../types'

const HIGH = 255

const SINGLE_CHAR_MOTOR_RELEASE = {
  type: 'motor' as const,
  data: { steps: -1, hold: true, speed: 'fast' },
}

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
  CHARS_PER_LINE = charsPerLine
  CARRIAGE_RETURN_STEPS = carriageReturnSteps
  NEWLINE_RETURN_STEPS = newlineRotationSteps
  KEYMAP = keyMap
}

function charsToSteps(noOfChars: number) {
  const stepsPerChar = CARRIAGE_RETURN_STEPS / CHARS_PER_LINE
  return stepsPerChar * noOfChars
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
    .map(character => {
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
        generateShiftSet(KEYMAP[character.toLowerCase()])
      }
    })
    .flat() // Flatten SHIFT sets.
    .filter(Boolean)
}

export function textToCommands(text: string) {
  const lines = splitToLines(text)
  const commandsByLine = lines.map(charsToDmxData).map(dmxSequenceArray =>
    dmxSequenceArray
      .map(dmxData => [
        {
          type: COMMANDS.MOTOR,
          // Unwind the carriage return motor as we go, 1 char at a time.
          data: { steps: charsToSteps(-1), hold: true, speed: 'fast' },
        },
        { type: COMMANDS.DMX, data: dmxData },
      ])
      .flat(),
  )

  return commandsByLine
    .map(commands => [
      ...commands,
      // Add motor command to reverse carriage.
      {
        type: COMMANDS.MOTOR,
        data: {
          speed: 'slow',
          hold: true,
          // Reel in for each character, plus the additional steps for a new line.
          steps: charsToSteps(commands.length / 2) + NEWLINE_RETURN_STEPS,
        },
      },
      {
        type: COMMANDS.MOTOR,
        data: {
          speed: 'slow',
          hold: true,
          // Reel the lever back out.
          steps: -NEWLINE_RETURN_STEPS,
        },
      },
    ])
    .flat()
}
