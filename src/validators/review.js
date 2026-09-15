'use strict'

/**
 * Validate the nil return confirmation checkbox on the review page
 */
module.exports = async (request) => {
  const payload = request.payload

  const errors = []

  if (Object.keys(payload).includes('continue') && payload.confirm !== 'yes') {
    errors.push({ confirm: 'EMPTY' })
  }

  return errors.length ? errors : null
}


