'use strict'

/**
 * Throw when user is attempting to access a resource that they don't own
 * @type {module.UnauthorizedError}
 */
class ResponseError extends Error {
  constructor (message, status, body) {
    super(message)
    this._statusCode = status
    this._name = 'Request error'
    this._body = body
  }

  get statusCode () {
    return this._statusCode
  }

  get name () {
    return this._name
  }

  get body () {
    return this._body
  }
}

module.exports = {
  status: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409
  },
  Error: ResponseError
}
