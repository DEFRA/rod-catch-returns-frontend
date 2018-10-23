'use strict'

/**
 * These routes are scanned automatically by the hapi-router
 */
const LoginHandler = require('../handlers/login')
const FailedLogin = require('../handlers/login-fail')
const LicenceHandler = require('../handlers/licence')

// Define the validators
const loginValidator = require('../validators/login')
const licenceValidator = require('../validators/licence')

// Define the handlers
const loginHandler = new LoginHandler('login', loginValidator)
const failedLogin = new FailedLogin('login', loginValidator)

const licenceHandler = new LicenceHandler('licence', licenceValidator)

module.exports = [

  /*
   * The following set of handlers are the additional set of handlers
   * required by teh FMT interface
   */

  // Login GET handler
  {
    path: '/login',
    method: 'GET',
    handler: loginHandler.handler,
    options: { auth: false }
  },

  // Login POST handler
  {
    path: '/login',
    method: 'POST',
    handler: loginHandler.handler,
    options: { auth: { strategies: ['active-dir-strategy', 'session'] } }
  },

  // Failed Login GET handler
  {
    path: '/login-fail',
    method: 'GET',
    handler: failedLogin.handler,
    options: { auth: false }
  },

  // Failed Login POST handler
  {
    path: '/login-fail',
    method: 'POST',
    handler: failedLogin.handler,
    options: { auth: { strategies: ['active-dir-strategy', 'session'] } }
  },

  /*
   * The remaining set of handlers are secured by the default authorization strategy -
   * using hapi-auth-cookie
   */
  // Licence not found GET handler
  {
    path: '/licence',
    method: ['GET', 'POST'],
    handler: licenceHandler.handler
  }
]
