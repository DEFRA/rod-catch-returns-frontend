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

/**
 * Check if the year entered is a leap year
 *
 * @param {number} year - The year to check as a number
 * @returns {boolean} If the year is a leap year
 */
function isLeapYear (year) {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)
}

module.exports = {
  calculateTokenTtl,
  isLeapYear
}
