
'use strict'

/**
 * Ask the to sign in
 */
const BaseHandler = require('./base')
const authenticateUser = require('../lib/authenticate-user')
const { msalClient } = require('../lib/msal-client')
const Boom = require('@hapi/boom')
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
   * Get the code returned from the Microsoft login and use it to return a token.
   * Use that token to make a request to /profile to see if it is valid.
   * Then redirect the user to the homepage
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  async doPost (request, h) {
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

      // if /profile is successful, set token on authorization
      request.app = {
        authorization: {
          name: tokenResponse.account.name,
          token: tokenResponse.accessToken
        }
      }

      // store session
      await authenticateUser(request)

      return h.redirect('/')
    } catch (error) {
      logger.error('Auth error:', error)
      return Boom.unauthorized('Authentication failed')
    }
  }
}
