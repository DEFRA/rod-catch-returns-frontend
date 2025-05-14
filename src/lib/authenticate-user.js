'use strict'

const { v4: uuid } = require('uuid')

const { logger } = require('defra-logging-facade')
/**
 * Sets up the cache and the session cookies for an authenticated user
 * @param request
 * @param h
 * @returns {Promise<*>}
 */
module.exports = async (request) => {
  if (!request.app.authorization) {
    throw new Error('Cannot set up session cookie and cache for an unauthenticated user')
  }

  // Set the cookie to the new session identifier
  request.cookieAuth.set({ sid: uuid() })

  if (request.app.authorization.token) {
    // If it is a user authentication then set the authorization details in the cache
    const cache = { authorization: request.app.authorization }
    await request.cache().set(cache)
    // authorization will have the token and user's name
    logger.debug('User is authenticated: ' + JSON.stringify(request.app.authorization))
  } else {
    // If the user is authenticated by the license set the contactId
    const cache = { contactId: request.app.authorization.contactId }
    await request.cache().set(cache)
    logger.debug('Contact is authenticated: ' + JSON.stringify(request.app.authorization.contactId))
  }
}
