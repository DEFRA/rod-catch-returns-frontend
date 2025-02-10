'use strict'

const LicenceApi = require('../api/licence')
const ResponseError = require('../handlers/response-error')

/**
 * Validate the licence number and postcode
 */
module.exports = async (request) => {
  const payload = request.payload
  let errors = []

  // Unmatched licence number
  if (!payload.licence) {
    errors.push({ licence: 'EMPTY' })
  } else if (!payload.postcode) {
    errors.push({ postcode: 'EMPTY' })
  } else {
    // Set up the contact id for the licence in the cache
    try {
      payload.contact = await LicenceApi.getContactFromLicenceKey(request, payload.licence, payload.postcode)
      if (!payload.contact) {
        errors.push({ licence: 'NOT_FOUND' })
      }
    } catch (err) {
      if (err.statusCode === ResponseError.status.NOT_FOUND || err.statusCode === ResponseError.status.FORBIDDEN) {
        errors.push({ licence: 'NOT_FOUND' })
      } else {
        errors = null
      }
    }
  }

  return errors.length ? errors : null
}
