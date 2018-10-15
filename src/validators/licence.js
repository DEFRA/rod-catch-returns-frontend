'use strict'

/**
 * Validate the licence number and postcode
 */
const { logger } = require('defra-logging-facade')
const getContactFromLicenceKey = require('../api/licence').getContactFromLicenceKey

module.exports = async (request) => {
  const payload = request.payload
  logger.debug('Validate licence: ' + JSON.stringify(payload))

  const errors = []

  // Set up the contact id for the licence in the cache
  payload.contact = await getContactFromLicenceKey(request, request.payload.licence.toUpperCase().trim())

  // Unmatched licence number
  if (!payload.licence) {
    errors.push({ licence: 'EMPTY' })
  } else if (!payload.postcode) {
    errors.push({ postcode: 'EMPTY' })
  } else if (!payload.contact) {
    errors.push({ licence: 'NOT_FOUND' })
  } else if (payload.postcode.toUpperCase().replace(/\s/g, '') !==
      payload.contact.contact.postcode.toUpperCase().replace(/\s/g, '')) {
    errors.push({ postcode: 'NOT_FOUND' })
  } else {
    return null
  }

  return errors
}