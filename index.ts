import { promises as fs } from 'fs'

import { DMX, EnttecUSBDMXProDriver, NullDriver } from 'dmx-ts'
import express from 'express'
import expressWs from 'express-ws'
import ngrok from 'ngrok'
import fetch from 'node-fetch'

import { emitter } from './events/index.js'
import { flushCache, log } from './log/index.js'
import { COMMANDS } from './queue/commands.js'
import { createKeyCommandHandler } from './queue/handlers/key.js'
import { createMotorCommandHandler } from './queue/handlers/motor.js'
import { RELAYS, createRelayCommandHandler } from './queue/handlers/relay.js'
import { createStatusLightCommandHandler } from './queue/handlers/status-light.js'
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
const CONFIG_URL = 'https://typo.digital/api/config'

function getDriver() {
  if (DEBUG_UNIVERSE) return new NullDriver()

  try {
    return new EnttecUSBDMXProDriver(USB_PORT_PI)
  } catch (e) {
    log.error('Failed to create Enttec driver')
    return new NullDriver()
  }
}

async function getVersion() {
  const packageJson = await fs
    .readFile('package.json', { encoding: 'utf-8' })
    .then(JSON.parse)

  return packageJson.version
}

async function connect(authtoken) {
  log.info('Creating ngrok tunnel')
  const url = await ngrok.connect({ authtoken, addr: NETWORK_PORT })
  log.info(`Tunnerl url: ${url}`)

  log.info('Pushing tunnel URL to TypOnline')
  await fetch(`${CONFIG_URL}/ngrok`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

async function loadConfig(): Promise<Config> {
  const configPayload = await (fetch(CONFIG_URL).then((res) =>
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
  let dmxUniverse
  try {
    dmxUniverse = await dmx.addUniverse('typewriter', getDriver())
    log.info('Initialised DMX driver')
  } catch {
    log.error('Failed to initialise DMX driver, using null driver')
    dmxUniverse = await dmx.addUniverse('typewriter', new NullDriver())
  }

  const keyCommandHandler = createKeyCommandHandler(dmxUniverse)
  registerHandler(COMMANDS.KEY, keyCommandHandler)
  log.info('Registered key command handler')

  const motorCommandHandler = createMotorCommandHandler()
  registerHandler(COMMANDS.MOTOR, motorCommandHandler)
  log.info('Registered motor command handler')

  const statusLightCommandHandler = createStatusLightCommandHandler(dmxUniverse)
  registerHandler(COMMANDS.STATUS_LIGHT, statusLightCommandHandler)
  log.info('Registered status light command handler')

  const relayCommandHandler = createRelayCommandHandler()
  registerHandler(COMMANDS.RELAY, relayCommandHandler)
  log.info('Registered relay command handler')

  // Stagger relays, for dramatic effect.
  ;[RELAYS.RELAY_1, RELAYS.RELAY_2, RELAYS.RELAY_3, RELAYS.RELAY_4].forEach(
    (relay, i) =>
      setInterval(
        () =>
          queueCommand({
            type: COMMANDS.RELAY,
            data: { [relay]: true },
          }),
        1000 * i,
      ),
  )
  log.info('Activated relays')

  return config
}

async function main() {
  log.info('Initialising typewriter-dmx')
  log.info(`Debug mode ${DEBUG_UNIVERSE ? 'enabled' : 'disabled'}`)

  const { ngrokApiKey } = await configure()
  await connect(ngrokApiKey)
  const version = await getVersion()

  const server = express().use(express.json())
  expressWs(server)

  server.get('/heartbeat', (req, res) => {
    res.send({ version })
  })

  server.get('/refresh', async (req, res) => {
    try {
      await configure()
    } catch {
      res.status(500).send()
      return
    }

    res.send('OK')
  })

  server.post('/broadcast', (req, res) => {
    try {
      log.info(`Received payload for broadcast: "${JSON.stringify(req.body)}"`)

      emitter.fireEvent('broadcast', req.body)
    } catch (e) {
      res.status(500).send(e)
      return
    }

    res.send('OK')
  })

  server.post('/event', (req, res) => {
    try {
      log.info(`Event received: "${req.body.type}"`)
      queueCommand(req.body)
    } catch (e) {
      res.status(500).send(e)
      return
    }

    res.send('OK')
  })

  server.post('/type', (req, res) => {
    try {
      const { text } = req.body
      log.info(`Received text: "${text}"`)
      const commands = textToCommands(req.body.text)
      queueCommand(...commands)
    } catch (e) {
      res.status(500).send(e)
      return
    }

    res.send('OK')
  })

  server.ws('/', (ws, req) => {
    emitter.onEvent((type, payload) =>
      ws.send(JSON.stringify({ type, payload })),
    )

    // Send logs to client on connection.
    flushCache()
  })

  server.listen(NETWORK_PORT)
  log.info(`Listening on port ${NETWORK_PORT}`)
}

main().catch(console.error)
