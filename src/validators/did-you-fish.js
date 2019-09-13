'use strict'

/**
 * Validate the did you fish input
 */
module.exports = async (request) => {
  const payload = request.payload

  const errors = []

  if (!payload.dyf) {
    errors.push({ dyf: 'EMPTY' })
  }

  return errors.length ? errors : null
}
