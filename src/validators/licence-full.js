'use strict'

const LicenceApi = require('../api/licence')
const ResponseError = require('../handlers/response-error')

/**
 * Validate the full licence number
 */
module.exports = async request => {
  const payload = request.payload
  let errors = []

  // Unmatched licence number
  if (!payload.licenceNumber) {
    errors.push({ licenceNumber: 'EMPTY' })
  } else {
    // Set up the contact id for the licence in the cache
    try {
      payload.licence = await LicenceApi.getContactFromFullLicenceNumber(request, payload.licenceNumber)
      if (!payload.licence) {
        errors.push({ licenceNumber: 'NOT_FOUND' })
      }
    } catch (err) {
      if (err.statusCode === ResponseError.status.NOT_FOUND || err.statusCode === ResponseError.status.FORBIDDEN) {
        errors.push({ licenceNumber: 'NOT_FOUND' })
      } else {
        errors = null
      }
    }
  }

  return errors.length ? errors : null
}
