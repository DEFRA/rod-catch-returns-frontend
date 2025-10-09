'use strict'

const LicenceApi = require('../api/licence')
const ResponseError = require('../handlers/response-error')
const { parsePostcode, parseLicence, licenceSchema } = require('../lib/licence-utils')

/**
 * Validate the licence number and postcode
 */
module.exports = async (request) => {
  const payload = request.payload

  if (!request.payload.licence) {
    return [{ licence: 'EMPTY' }]
  }

  if (!request.payload.postcode) {
    return [{ postcode: 'EMPTY' }]
  }

  const licence = parseLicence(request.payload.licence)
  const postcode = parsePostcode(request.payload.postcode)
  const result = licenceSchema.validate({ licence, postcode }, { allowUnknown: true, abortEarly: true })

  if (result.error) {
    return [{ licence: 'VALIDATION_ERROR' }]
  }

  // Set up the contact id for the licence in the cache
  try {
    payload.contact = await LicenceApi.getContactFromLicenceKey(request, licence, postcode)
    if (!payload.contact) {
      return [{ licence: 'NOT_FOUND' }]
    }
  } catch (err) {
    if (err.statusCode === ResponseError.status.NOT_FOUND || err.statusCode === ResponseError.status.FORBIDDEN) {
      return [{ licence: 'NOT_FOUND' }]
    }
  }

  return null
}
