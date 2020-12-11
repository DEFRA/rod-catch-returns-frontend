const { logger } = require('defra-logging-facade')
const NodeClam = require('clamscan')

const wait = interval => new Promise(resolve => setTimeout(resolve, interval))

async function retryAntiVirusInit (config, retries, delay) {
  try {
    return await new NodeClam(config).init()
  } catch (err) {
    if (retries === 0) {
      throw err
    }
    logger.info(`Unable to find virus scanner - retries left ${retries}`)
    await wait(delay)
    return await retryAntiVirusInit(config, --retries, delay)
  }
}

module.exports = {
  retryAntiVirusInit
}
