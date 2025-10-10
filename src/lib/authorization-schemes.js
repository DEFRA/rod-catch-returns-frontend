'use strict'

/**
 * This file contains the handlers for the authorization strategies used by hapi
 */

const LicenceApi = require('../api/licence')
const { parsePostcode, parseLicence, licenceSchema } = require('./licence-utils')

module.exports = {
  licenceScheme: () => {
    return {

      options: {
        payload: true
      },

      payload: async (request, h) => {
        if (!request.payload.licence || !request.payload.postcode) {
          return h.continue
        }

        const licence = parseLicence(request.payload.licence)
        const postcode = parsePostcode(request.payload.postcode)

        const result = licenceSchema.validate({ licence, postcode }, { allowUnknown: true, abortEarly: true })

        // If cannot validate the schema is not authorized
        if (result.error) {
          return h.continue
        }

        try {
          const contact = await LicenceApi.getContactFromLicenceKey(request, licence, postcode)
          request.app = {
            authorization: { contactId: contact.contact.id }
          }
          return h.continue
        } catch (err) {
          if (Math.floor(Number.parseInt(err.statusCode) / 100) === 4) {
            return h.continue
          }
          throw err
        }
      },

      authenticate: async (request, h) => {
        return h.authenticated({ credentials: {} })
      }
    }
  }
}
