import { UniverseData } from 'dmx-ts/dist/src/models/IUniverseDriver'

import { RelayCommand as InternalRelayCommand } from './handlers/relay'
import { Colour } from './handlers/status-light'

export enum COMMANDS {
  KEY = 'key',
  STATUS_LIGHT = 'status-light',
  MOTOR = 'motor',
  RELAY = 'relay',
  HEARTBEAT = 'heartbeat',
}

export interface Command {
  type: COMMANDS
  data?: any
}

export interface KeyCommand extends Command {
  type: COMMANDS.KEY
  data: UniverseData
}

export interface MotorData {
  steps: number
  speed: 'slow' | 'fast'
  hold: boolean
}

export interface MotorCommand extends Command {
  type: COMMANDS.MOTOR
  data: undefined
}

export interface RelayCommand extends Command {
  type: COMMANDS.RELAY
  data: InternalRelayCommand
}

export interface StatusLightCommand extends Command {
  type: COMMANDS.STATUS_LIGHT
  data: Colour
}

export type CommandHandler = (Command) => void
