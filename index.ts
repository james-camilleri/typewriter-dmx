import { DMX, EnttecUSBDMXProDriver, NullDriver } from 'dmx-ts'

import { queueDmxUpdates } from './queue-commands/index.js'
import { textToDmx } from './text-to-dmx/index.js'

const DEBUG_UNIVERSE = false
const USB_PORT = 'COM3'

function getDriver() {
  if (DEBUG_UNIVERSE) return new NullDriver()
  return new EnttecUSBDMXProDriver(USB_PORT)
}

async function main() {
  const dmx = new DMX()
  const typewriterUniverse = await dmx.addUniverse('typewriter', getDriver())

  const TEST_TEXT = 'hhhhhhhhhh' // LED is currently hooked up to channel 17.
  const channelData = textToDmx(TEST_TEXT)
  queueDmxUpdates(typewriterUniverse, channelData)
}

main().catch(console.error)
