'use strict'

const { validateSession } = require('./session-validator')

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
    validateFunc: validateSession
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
    validateFunc: validateSession
  }
}
