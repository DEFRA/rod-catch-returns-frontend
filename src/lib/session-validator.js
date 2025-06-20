'use strict'

/**
 * Hapi authentication session validation function
 *
 * This function is called on every request to validate the session cookie.
 * It checks if the session ID exists in the cache.
 *
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {{ sid: string }} session - The session object containing the session ID
 * @returns {Promise<{ valid: boolean, credentials?: any }>} The validation result
 */
const validateSession = async (request, session) => {
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

module.exports = { validateSession }
