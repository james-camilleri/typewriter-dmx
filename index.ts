import { promises as fs } from 'fs'

import { DMX, EnttecUSBDMXProDriver, NullDriver } from 'dmx-ts'
import express from 'express'
import ngrok from 'ngrok'
import fetch from 'node-fetch'

import { log } from './log/index.js'
import { createDmxCommandHandler } from './queue/handlers/dmx.js'
import { createMotorCommandHandler } from './queue/handlers/motor.js'
import { queueCommand, registerHandler } from './queue/index.js'
import {
  configure as textToCommandConfigure,
  textToCommands,
} from './text-to-commands/index.js'
import { Config } from './types'

const DEBUG_UNIVERSE = false
const USB_PORT_WINDOWS = 'COM3'
const USB_PORT_PI =
  '/dev/serial/by-id/usb-ENTTEC_DMX_USB_PRO_EN236685-if00-port0'
const NETWORK_PORT = 1992
const CONFIG_URL = 'https://typo.digital/config'

function getDriver() {
  if (DEBUG_UNIVERSE) return new NullDriver()
  return new EnttecUSBDMXProDriver(USB_PORT_PI)
}

async function getVersion() {
  const packageJson = await fs
    .readFile('package.json', { encoding: 'utf-8' })
    .then(JSON.parse)

  return packageJson.version
}

async function connect() {
  log.info('Creating ngrok tunnel')
  const url = await ngrok.connect(NETWORK_PORT)

  log.info('Pushing tunnel URL to TypOnline')
  await fetch(`${CONFIG_URL}/ngrok`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

async function loadConfig(): Promise<Config> {
  const configPayload = await (fetch(CONFIG_URL).then(res =>
    res.json(),
  ) as Promise<Config>)
  const config = configPayload
  // @ts-expect-error Convert JSON string into key map.
  config.keyMap = JSON.parse(configPayload.keyMap)

  return config
}

async function configure() {
  const config = await loadConfig()
  textToCommandConfigure(config)

  const dmx = new DMX()
  const typewriterUniverse = await dmx.addUniverse('typewriter', getDriver())

  const dmxCommandHandler = createDmxCommandHandler(typewriterUniverse)
  registerHandler('dmx', dmxCommandHandler)

  const motorCommandHandler = createMotorCommandHandler(config)
  registerHandler('motor', motorCommandHandler)
}

async function main() {
  log.info('Initialising typewriter-dmx')
  log.info(`Debug mode ${DEBUG_UNIVERSE ? 'enabled' : 'disabled'}`)

  await connect()
  await configure()
  const version = await getVersion()

  const app = express().use(express.json())

  app.get('/heartbeat', (req, res) => {
    res.send({ version })
  })

  app.get('/config/refresh', async (req, res) => {
    try {
      await configure()
    } catch {
      res.status(500).send()
      return
    }

    res.send('OK')
  })

  app.post('/', (req, res) => {
    try {
      const { text } = req.body
      log.info('Received text:', text)
      const commands = textToCommands(req.body.text.toLowerCase())
      log.info('Converted to commands:', commands)
      queueCommand(...commands)
    } catch (e) {
      res.status(500).send(e)
      return
    }

    res.send('OK')
  })

  app.get('/test/:steps/:speed/:hold', (req, res) => {
    queueCommand({
      type: 'motor',
      data: {
        hold: req.params.hold === 'hold',
        steps: Number(req.params.steps),
        speed: req.params.steps ?? 'slow',
      },
    })
    res.send('OK')
  })

  app.listen(NETWORK_PORT)
  log.info(`Listening on port ${NETWORK_PORT}`)
}

main().catch(console.error)
