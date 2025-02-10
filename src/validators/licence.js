'use strict'

const LicenceApi = require('../api/licence')
const ResponseError = require('../handlers/response-error')

const ukPostcodeRegex = /^([A-PR-UWYZ]\d{1,2}[A-HJKPSTUW]?|[A-PR-UWYZ][A-HK-Y]\d{1,2}[ABEHMNPRVWXY]?)\s{0,6}(\d[A-Z]{2})$/i

const parsePostcode = (postcode) => {
  return postcode.trim().replace(ukPostcodeRegex, '$1 $2').toUpperCase()
}

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
    const postcode = parsePostcode(payload.postcode)
    try {
      payload.contact = await LicenceApi.getContactFromLicenceKey(request, payload.licence, postcode)
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
