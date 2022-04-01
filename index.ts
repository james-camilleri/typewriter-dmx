import { DMX, EnttecUSBDMXProDriver, NullDriver } from 'dmx-ts'
import express from 'express'
import ngrok from 'ngrok'
import fetch from 'node-fetch'

import { queueDmxUpdates } from './queue-commands/index.js'
import { textToDmx } from './text-to-dmx/index.js'

const DEBUG_UNIVERSE = false
const USB_PORT_WINDOWS = 'COM3'
const USB_PORT_PI = '/dev/serial/by-id/usb-ENTTEC_DMX_USB_PRO_EN236685-if00-port0'
const NETWORK_PORT = 1992
const CONFIG_URL = 'https://typo.digital/config'

function getDriver() {
  if (DEBUG_UNIVERSE) return new NullDriver()
  return new EnttecUSBDMXProDriver(USB_PORT_PI)
}

async function connect() {
  const url = await ngrok.connect(NETWORK_PORT)
  await fetch(`${CONFIG_URL}/ngrok`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

async function main() {
  await connect()

  const dmx = new DMX()
  const typewriterUniverse = await dmx.addUniverse('typewriter', getDriver())

  const app = express().use(express.json())

  app.get('/heartbeat', (req, res) => {
    res.send('OK')
  })

  app.post('/', (req, res) => {
    try {
      const channelData = textToDmx(req.body.text)
      queueDmxUpdates(typewriterUniverse, channelData)
    } catch (e) {
      res.status(500).send(e)
      return
    }

    res.send('OK')
  })

  app.listen(NETWORK_PORT)
}

main().catch(console.error)
