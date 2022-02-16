import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { DMX, EnttecUSBDMXProDriver, NullDriver } from 'dmx-ts'
import express from 'express'

import { queueDmxUpdates } from './queue-commands/index.js'
import { textToDmx } from './text-to-dmx/index.js'

const DEBUG_UNIVERSE = true
const USB_PORT = 'COM3'
const NETWORK_PORT = 1992

function getDriver() {
  if (DEBUG_UNIVERSE) return new NullDriver()
  return new EnttecUSBDMXProDriver(USB_PORT)
}

async function main() {
  const dmx = new DMX()
  const typewriterUniverse = await dmx.addUniverse('typewriter', getDriver())

  const app = express().use(express.json())
  app.get('/', (req, res) => {
    res.sendFile(join(dirname(fileURLToPath(import.meta.url)), 'ui/index.html'))
  })

  app.post('/', (req, res) => {
    const { text } = req.body
    const channelData = textToDmx(text)
    queueDmxUpdates(typewriterUniverse, channelData)

    res.send('OK')
  })

  app.listen(NETWORK_PORT)
}

main().catch(console.error)
