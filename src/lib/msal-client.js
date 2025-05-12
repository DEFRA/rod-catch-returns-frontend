const msal = require('@azure/msal-node')
const Boom = require('@hapi/boom')
const { v4: uuid } = require('uuid')
const Client = require('../api/client')
const { logger } = require('defra-logging-facade')

/** @type {msal.Configuration} */
const config = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID,
    clientSecret: process.env.MSAL_CLIENT_SECRET,
    authority: process.env.MSAL_ENDPOINT
  }
}

const msalClient = new msal.ConfidentialClientApplication(config)

const getAuthenticationUrl = async (_, h) => {
  const authUrl = await msalClient.getAuthCodeUrl({
    scopes: [`${process.env.MSAL_CLIENT_ID}/.default`],
    redirectUri: process.env.MSAL_REDIRECT_URI,
    responseMode: 'form_post'
  })
  return h.redirect(authUrl)
}

const oidcSignIn = async (request, h) => {
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

module.exports = {
  getAuthenticationUrl, oidcSignIn
}
