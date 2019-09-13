'use strict'

/**
 * This module is responsible for the API rest interface and is data agnostic.
 */
const Url = require('url')
const Hoek = require('@hapi/hoek')
const ResponseError = require('../handlers/response-error')
const ETagRequest = require('request-etag')
const Fs = require('fs')

const Request = new ETagRequest({
  length: function () {
    return 1 // Consider each entry size 1 (Used by max)
  },
  maxAge: process.env.LRU_TTL || 1800000,
  max: process.env.LRU_ITEMS || 200000
})

const { logger } = require('defra-logging-facade')

const internals = {
  method: {
    GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE', PATCH: 'PATCH'
  },

  /**
   * Function to determine which headers should be set
   * @param method
   * @param assoc
   */
  headers: (method, assoc) => {
    const headers = {}
    if (assoc) {
      headers['Content-Type'] = 'text/uri-list'
    } else {
      headers['Content-Type'] = 'application/json'
    }
    return headers
  },

  /**
   * Generate the URI for the request
   * @param path
   * @param query
   * @param body
   * @return {string}
   */
  createRequest: (path, search) => {
    try {
      const uriObj = {
        protocol: 'http',
        hostname: process.env.API_HOSTNAME || 'localhost',
        port: Number.parseInt(process.env.API_PORT || 9580),
        pathname: path ? process.env.API_PATH + '/' + path : process.env.API_PATH
      }

      if (search) {
        uriObj.search = search
      }

      return Url.format(uriObj)
    } catch (err) {
      logger.error(err)
      throw err
    }
  },

  /**
   * Bottom level request method
   * @param uri - the request path
   * @param method - internals.method
   * @param body - (JSON formatted request payload)
   * @param throwOnNotFound - if throw throws exception on 404
   * @param assoc - if true will operate on associations (using the text/uri-list header)
   * @returns {Promise<void>}
   */
  makeRequest: (auth, uri, method, body, throwOnNotFound = false, assoc = false) => {
    return new Promise(function (resolve, reject) {
      Hoek.assert(internals.method[method], `Method not allowed: ${method}`)

      const requestObject = {
        uri: uri,
        method: method,
        timeout: Number.parseInt(process.env.API_REQUEST_TIMEOUT_MS) || 60000,
        json: !assoc
      }

      if (auth) {
        requestObject.auth = {
          user: auth.username,
          pass: auth.password,
          sendImmediately: true
        }
      }

      if (body) {
        logger.debug(`Payload; ${JSON.stringify(body, null, 2)}`)
        requestObject.body = body
      }

      requestObject.headers = internals.headers(method, assoc)

      Request(requestObject, (err, response, body) => {
        if (err) {
          return reject(new Error(err))
        } else {
          logger.debug(`API; ${method}:${uri} ${response.statusCode}`)
        }

        // If no error occurred i.e. all statuses but 2xx - or a 304 (cache)
        if (Math.floor(response.statusCode / 100) === 2 || response.statusCode === 304) {
          resolve(body)
        } else if (response.statusCode === ResponseError.status.NOT_FOUND) {
          // Not found is ignored for searches otherwise it is treated as an error
          if (throwOnNotFound) {
            reject(new ResponseError.Error(response.statusMessage, ResponseError.status.NOT_FOUND))
          } else {
            resolve()
          }
        } else if (response.statusCode === ResponseError.status.CONFLICT) {
          // Conflicts are key violations and treated as validation errors
          resolve({ statusCode: response.statusCode, statusMessage: response.statusMessage })
        } else if (response.statusCode === ResponseError.status.BAD_REQUEST) {
          // Bad requests may be API validation errors
          if (body && Object.keys(body).includes('errors')) {
            resolve(body)
          // Age weight key upload specific errors
          } else if (body && (Object.keys(JSON.parse(body)).includes('generalErrors') ||
                              Object.keys(JSON.parse(body)).includes('headerErrors') ||
                              Object.keys(JSON.parse(body)).includes('errorsByRow') ||
                              Object.keys(JSON.parse(body)).includes('errorsByColumnAndRowNumber'))) {
            resolve({ statusCode: response.statusCode, statusMessage: JSON.parse(body) })
          } else {
            reject(new ResponseError.Error(response.statusMessage, response.statusCode))
          }
        } else {
          // All other errors are thrown 403 forbidden and server 500 errors
          reject(new ResponseError.Error(response.statusMessage, response.statusCode))
        }
      })
    })
  }
}

module.exports = {
  request: async (auth, method, path, search, body, throwOnNotFound = false) => {
    const request = internals.createRequest(path, search)
    return internals.makeRequest(auth, request, method, body, throwOnNotFound, false)
  },

  requestAssociationChange: async (auth, path, payload) => {
    const request = internals.createRequest(path)
    return internals.makeRequest(auth, request, internals.method.PUT, payload, true, true)
  },

  requestFromLink: async (auth, link) => {
    return internals.makeRequest(auth, link, internals.method.GET, null, true, false)
  },

  /**
   * The file uploader - accepts a file path and (at this point) assumes a .CSV file
   * @param auth
   * @param path
   * @param query
   * @param filePath
   * @returns {Promise<*|Promise<void>>}
   */
  requestFileUpload: async (auth, path, query, filePath) => {
    return internals.makeRequest(
      auth,
      internals.createRequest(path, query),
      internals.method.POST,
      Fs.createReadStream(filePath),
      true,
      true)
  },

  method: internals.method
}
