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

    redirectTo: '/licence-auth',
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
  },
  adminCookie: {
    cookie: {
      name: 'sid',
      password: process.env.COOKIE_PW,
      ttl: null,
      isSecure: process.env.HTTPS === 'true',
      isHttpOnly: process.env.HTTPS === 'true',
      isSameSite: 'Lax',
      path: '/'
    },
    redirectTo: '/login',
    appendNext: true,
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
