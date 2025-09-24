const { logger } = require('defra-logging-facade')

const IGNORE_PATHS = ['/public/', '/robots.txt']

function logRequest (request, h) {
  if (IGNORE_PATHS.some(path => request.path.includes(path))) {
    return h.continue
  }

  const { method, path, payload } = request

  const body = payload ? ` - ${JSON.stringify(payload)}` : ''

  logger.info(`${method.toUpperCase()} ${path}${body}`)

  return h.continue
}

function logResponse (request, h) {
  if (IGNORE_PATHS.some(path => request.path.includes(path))) {
    return h.continue
  }

  const { method, path, response } = request

  logger.info(`${method.toUpperCase()} ${path} -> ${response?.statusCode}`)

  return h.continue
}

module.exports = {
  logRequest,
  logResponse
}
