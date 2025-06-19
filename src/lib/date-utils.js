'use strict'

/**
 * Calculates the time-to-live (TTL) in milliseconds for an access token
 * based on its expiry time.
 *
 * @param {Date|string|number} expiresOn - The expiration time of the token. Can be a Date object, ISO string, or timestamp.
 * @returns {number} The TTL in milliseconds.
 * @throws {Error} If the expiration time is invalid or in the past.
 */
function calculateTokenTtl (expiresOn) {
  const expiryDate = new Date(expiresOn)
  const now = new Date()

  if (isNaN(expiryDate.getTime())) {
    throw new Error('Invalid expiration time provided')
  }

  const ttlMs = expiryDate.getTime() - now.getTime()

  return ttlMs
}

module.exports = {
  calculateTokenTtl
}
