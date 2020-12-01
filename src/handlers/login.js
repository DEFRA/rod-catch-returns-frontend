'use strict'

/**
 * Ask the FMT user for their authorization details
 */
const BaseHandler = require('./base')
const authenticateUser = require('../lib/authenticate-user')
const querystring = require('querystring')

module.exports = class LoginHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Display the authentication page
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    return h.view(this.path)
  }

  /**
   * If the user has been authenticated using the
   * validator then assign a session identifier to the authorization cookie
   * and redirect to the start of the authenticated journey
   * @param request
   * @param h
   * @param errors
   * @returns {Promise<*>}
   */
  async doPost (request, h, errors) {
    let qryStr = false
    if (errors) {
      const next = request.query.next ? '?next=' + encodeURIComponent(request.query.next) : ''
      return h.redirect('/login-fail' + next)
    }
    if (request.query.next && request.query.next.startsWith('/lookup')) {
      qryStr = querystring.unescape(request.raw.req.url)
        .replace('/login?next=/lookup', '')
        .replace('/login-fail?next=/lookup', '')
    }

    await authenticateUser(request)

    // In the FMT journey we can be redirected into the service
    return h.redirect(qryStr ? '/lookup' + qryStr : '/licence')
  }
}
