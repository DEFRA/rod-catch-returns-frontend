
'use strict'

/**
 * Ask the to sign in
 */
const BaseHandler = require('./base')
// const authenticateUser = require('../lib/authenticate-user')
const { msalClient } = require('../lib/azure-auth')
const Boom = require('@hapi/boom')
const { v4: uuid } = require('uuid')
const Client = require('../api/client')
const { logger } = require('defra-logging-facade')

module.exports = class LoginHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Display the Microsoft authentication page
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  async doGet (_, h) {
    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: [`${process.env.MSAL_CLIENT_ID}/.default`],
      redirectUri: process.env.MSAL_REDIRECT_URI,
      responseMode: 'form_post'
    })
    return h.redirect(authUrl)
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
    const { code } = request.payload
    if (!code) {
      return Boom.unauthorized('No authorization code provided')
    }

    try {
      const tokenResponse = await msalClient.acquireTokenByCode({
        code,
        scopes: [],
        redirectUri: process.env.MSAL_REDIRECT_URI
      })

      // call /profile, if the user is unauthorized it will return a 401
      await Client.request(tokenResponse.accessToken, Client.method.GET, 'profile')

      /*
       * maybe ablt to do
       * request.app = {
       *  authorization: auth
       * }
       *
       * could set token in above code instead of cookie, then call authenticateUser
       */
      request.cookieAuth.set({
        name: tokenResponse.account.name,
        token: tokenResponse.accessToken,
        sid: uuid()
      })

      await request.cache().set({ authorization: { name: tokenResponse.account.name } })

      return h.redirect('/')
    } catch (error) {
      logger.error('Auth error:', error)
      return Boom.unauthorized('Authentication failed')
    }
  }
}
