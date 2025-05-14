'use strict'

/**
 * This file contains the handlers for the authorization strategies used by hapi
 */

const Joi = require('@hapi/joi')
const LicenceApi = require('../api/licence')

// Joi schema to validate a licence payload
const licenceSchema = Joi.object().keys({
  licence: Joi.string().alphanum().min(6).max(6).required(),
  postcode: Joi.string().required()
})

const ukPostcodeRegex = /^([A-PR-UWYZ]\d{1,2}[A-HJKPSTUW]?|[A-PR-UWYZ][A-HK-Y]\d{1,2}[ABEHMNPRVWXY]?)\s{0,6}(\d[A-Z]{2})$/i

const parsePostcode = (postcode) => {
  return postcode.trim().replace(ukPostcodeRegex, '$1 $2').toUpperCase()
}

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

        const licence = request.payload.licence.replace(/\s+/g, '').toUpperCase()
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
