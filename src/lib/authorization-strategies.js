'use strict'

/**
 * This file contains the handlers for the authorization strategies used by hapi
 */
module.exports = {
  sessionCookie: {
    cookie: {
      name: 'sid',
      password: process.env.COOKIE_PW,
      isSecure: process.env.HTTPS === 'true',
      clearInvalid: true
    },

    redirectTo: process.env.CONTEXT === 'ANGLER' ? '/licence-auth' : '/login',
    appendNext: process.env.CONTEXT === 'FMT',
    /**
     * validation function called on every request
     * When the cache-entry expires the user has to re-authenticate
     */
    validateFunc: async (request, session) => {
      const server = request.server
      const cached = await server.app.cache.get(session.sid)

      const out = {
        valid: !!cached
      }

      if (out.valid) {
        out.credentials = cached.authorization
      }

      return out
    }
  }
}
