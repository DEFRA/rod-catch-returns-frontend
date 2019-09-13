'use strict'

/**
 * Validate the user login
 */
module.exports = async (request) => {
  if (request.app.authorization) {
    return null
  } else {
    return [{ authorization: 'NO_FOUND' }]
  }
}
