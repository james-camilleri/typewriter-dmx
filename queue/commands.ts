import { UniverseData } from 'dmx-ts/dist/src/models/IUniverseDriver'

export const COMMANDS = {
  DMX: 'dmx',
  MOTOR: 'motor',
} as const

export type CommandType = typeof COMMANDS[keyof typeof COMMANDS]

export interface Command {
  type: CommandType
  data: any
}

export interface DmxCommand extends Command {
  type: 'dmx'
  data: UniverseData
}

export interface MotorCommand extends Command {
  type: 'motor'
  data: number
}

export type CommandHandler = (Command) => void
