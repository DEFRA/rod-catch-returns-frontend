const Boom = require('@hapi/boom')
const OpenIdClient = require('openid-client')
const { logger } = require('defra-logging-facade')

const { generators, Issuer } = OpenIdClient

let client = null
let cache = null
let redirectUri = null

const initialise = async (server) => {
  const MsIssuer = await Issuer.discover(process.env.OIDC_ENDPOINT)
  logger.info('Discovered issuer %s %O', MsIssuer.issuer, MsIssuer.metadata)

  redirectUri = new URL(
    '/oidc/signin',
    process.env.OIDC_REDIRECT_HOST
  ).toString()
  client = new MsIssuer.Client({
    client_id: process.env.OIDC_CLIENT_ID,
    client_secret: process.env.OIDC_CLIENT_SECRET,
    redirect_uris: [redirectUri],
    response_types: ['code', 'id_token']
  })
  cache = server.cache({ segment: 'oidc', expiresIn: 12 * 60 * 60 * 1000 })

  server.auth.strategy('oidc', 'cookie', {
    cookie: {
      name: process.env.OIDC_SESSION_COOKIE_NAME,
      password: process.env.OIDC_SESSION_COOKIE_PASSWORD,
      ttl: null,
      isSecure: process.env.NODE_ENV !== 'development',
      isHttpOnly: process.env.NODE_ENV !== 'development',
      isSameSite: 'Lax',
      path: '/'
    },
    redirectTo: oidcRedirect,
    validateFunc: async (request, session) => {
      if (session.oid) {
        return { valid: true, credentials: session }
      }
      return { valid: false }
    }
  })
  server.auth.default('oidc')
}

const oidcRedirect = request => {
  const nonce = generators.nonce()
  const state = generators.state()
  cache.set(state, { state, nonce, postAuthRedirect: request.path })
  request.cookieAuth.clear()
  const url = client.authorizationUrl({
    scope: 'openid profile email',
    response_type: 'code id_token',
    response_mode: 'form_post',
    domain_hint: 'defra.gov.uk',
    nonce: nonce,
    state: state
  })
  logger.info('Redirect URL: %s', url)
  return url
}

/**
 * OIDC Authentication Handler - handles POST callbacks from the OpenID connect provider
 *
 * @param request the hapi request object
 * @param h the hapi response handler
 * @returns {Promise}
 */
const signIn = async (request, h) => {
  const success = !!request.payload.id_token
  if (success) {
    // Retrieve the nonce from the server cache for the given state value
    const { nonce, state, postAuthRedirect = '/login' } = (await cache.get(request.payload.state)) ?? {}
    // Validate the jwt token

    const tokenSet = await client.callback(redirectUri, request.payload, { nonce: nonce, state: state })

    logger.info('Received and validated oidc token.  Claims: %o', tokenSet.claims())
    const { oid, name, email, exp } = tokenSet.claims()

    /*
     *  const userDetails = await salesApi.getSystemUser(oid)
     *    const hasTelesalesRole = !!userDetails?.roles.find(role => role.name === process.env.OIDC_REQUIRE_DYNAMICS_ROLE)
     */
    const userDetails = oid
    const hasTelesalesRole = true

    if (!userDetails || userDetails.isDisabled) {
      return h.redirect('/oidc/account-disabled')
    } else if (!hasTelesalesRole) {
      return h.redirect('/oidc/role-required')
    } else {
      request.cookieAuth.set({ oid, name, email })
      const expMs = exp * 1000 // expiry is in seconds, convert to ms
      logger.info('Token expires at: %s', new Date(expMs))
      request.cookieAuth.ttl(expMs - Date.now())
      return h.redirect(postAuthRedirect)
    }
  } else {
    const { error, error_description: errorDescription } = request.payload
    console.error('OIDC redirect with error: ', error, errorDescription)
    throw Boom.badImplementation(`Authentication error: ${error}: ${errorDescription}`)
  }
}

module.exports = {
  initialise, signIn
}
