'use strict'

/**
 * This file contains the handlers for the authorization strategies used by hapi
 */

const Joi = require('@hapi/joi')
const Client = require('../api/client')
const LicenceApi = require('../api/licence')

// Joi schema to validate a licence payload
const licenceSchema = Joi.object().keys({
  licence: Joi.string().alphanum().min(6).max(6).required(),
  postcode: Joi.string().required()
})

// Joi schema to validate an active directory login payload
const activeDirectorySchema = Joi.object().keys({
  user: Joi.string().email({ minDomainSegments: 2 }).required(),
  password: Joi.string().required()
})

module.exports = {
  activeDirScheme: () => {
    return {
      options: {
        payload: true
      },

      payload: async (request, h) => {
        if (!request.payload.user || !request.payload.password) {
          return h.continue
        }

        request.payload.user = request.payload.user.replace(/\s+/g, '')

        const result = activeDirectorySchema.validate(request.payload,
          { allowUnknown: true, abortEarly: true })

        // If cannot validate the schema is not authorized
        if (result.error) {
          return h.continue
        }

        const auth = {
          username: request.payload.user,
          password: request.payload.password
        }

        try {
          await Client.request(auth, Client.method.GET, 'profile')
          request.app = {
            authorization: auth
          }
          return h.continue
        } catch (err) {
          if (Math.floor(Number.parseInt(err.statusCode) / 100) === 4) {
            return h.continue
          } else {
            throw err
          }
        }
      },

      /**
       * Hapi does not support authentication based on the payload as the authentication
       * system expected authentication system in the hearer and this is problematic where no javascript
       * is permitted. So here the authentication is passed on to the payload function which is intended
       * for schema validation
       * @param request
       * @param h
       * @returns {Promise<*>}
       */
      authenticate: async (request, h) => {
        return h.authenticated({ credentials: {} })
      }
    }
  },

  licenceScheme: () => {
    return {

      options: {
        payload: true
      },

      payload: async (request, h) => {
        if (!request.payload.licence || !request.payload.postcode) {
          return h.continue
        }

        request.payload.licence = request.payload.licence.replace(/\s+/g, '')
        request.payload.postcode = request.payload.postcode.trim()

        const result = licenceSchema.validate(request.payload, { allowUnknown: true, abortEarly: true })

        // If cannot validate the schema is not authorized
        if (result.error) {
          return h.continue
        }

        const licence = request.payload.licence.toUpperCase()
        const postcode = request.payload.postcode.toUpperCase()

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
