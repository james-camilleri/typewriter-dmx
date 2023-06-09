import { UniverseData } from 'dmx-ts/dist/src/models/IUniverseDriver'

import { RelayCommand as InternalRelayCommand } from './handlers/relay'
import { Colour } from './handlers/status-light'

export enum COMMANDS {
  EXTERNAL_DMX = 'external-dmx',
  HEARTBEAT = 'heartbeat',
  KEY = 'key',
  MOTOR = 'motor',
  RELAY = 'relay',
  STATUS_LIGHT = 'status-light',
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
  data: Colour[]
}

export interface ExternalDmxCommand extends Command {
  type: COMMANDS.EXTERNAL_DMX
  data: {
    channel: number
    value: number | Colour
    transitionDuration?: number
  }
}

export type CommandHandler = (Command) => void
