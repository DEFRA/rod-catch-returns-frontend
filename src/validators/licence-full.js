'use strict'

const logger = require('../lib/logger-utils')

const LicenceApi = require('../api/licence')
const ResponseError = require('../handlers/response-error')

/**
 * Validate the full licence number
 */
module.exports = async request => {
  const payload = request.payload
  const errors = []

  if (!payload.licenceNumber) {
    errors.push({ licenceNumber: 'EMPTY' })
  } else if (!payload.licenceNumber.match(/^[A-Za-z0-9_-]*$/)) {
    errors.push({ licenceNumber: 'BAD_REQUEST' })
  } else {
    try {
      payload.licence = await LicenceApi.getContactFromFullLicenceNumber(request, payload.licenceNumber)
      if (!payload.licence) {
        errors.push({ licenceNumber: 'NOT_FOUND' })
      }
    } catch (err) {
      if (err.statusCode === ResponseError.status.NOT_FOUND || err.statusCode === ResponseError.status.FORBIDDEN) {
        errors.push({ licenceNumber: 'NOT_FOUND' })
      } else {
        logger.error(err)
        errors.push({ licenceNumber: 'NOT_FOUND' })
      }
    }
  }

  return errors.length ? errors : null
}
