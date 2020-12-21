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

function requestCallback (reject, method, uri, resolve, throwOnNotFound) {
  return (err, response, body) => {
    if (err) {
      return reject(new Error(err))
    } else {
      logger.debug(`API; ${method}:${uri} ${response.statusCode}`)
    }
    // If we can deserialize the body as JSON then do so
    const responseBody = (() => {
      try {
        return JSON.parse(body || {})
      } catch (e) {
        return body
      }
    })()
    // If no error occurred i.e. all statuses but 2xx - or a 304 (cache)
    if (Math.floor(response.statusCode / 100) === 2 || response.statusCode === 304) {
      resolve(responseBody)
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
      if (Object.keys(responseBody).includes('errors')) {
        resolve(responseBody)
      } else {
        reject(new ResponseError.Error(response.statusMessage, response.statusCode))
      }
    } else {
      // All other errors are thrown 403 forbidden and server 500 errors
      reject(new ResponseError.Error(response.statusMessage, response.statusCode))
    }
  }
}

const internals = {
  method: {
    GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE', PATCH: 'PATCH'
  },

  /**
   * Function to determine which headers should be set
   * @param method
   * @param assoc
   */
  typeHeader: {
    ASSOC: 'text/uri-list',
    JSON: 'application/json',
    CSV: 'text/csv'
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
   * @param typeHeader - specifies the mime type header
   * @returns {Promise<void>}
   */
  makeRequest: (auth, uri, method, body, throwOnNotFound = false, typeHeader = internals.typeHeader.JSON) => {
    return new Promise(function (resolve, reject) {
      Hoek.assert(internals.method[method], `Method not allowed: ${method}`)
      Hoek.assert(Object.values(internals.typeHeader).includes(typeHeader), `Type not allowed: ${typeHeader}`)

      const requestObject = {
        uri: uri,
        method: method,
        timeout: Number.parseInt(process.env.API_REQUEST_TIMEOUT_MS) || 60000,
        json: false // This influences both the headers and treatment of the response body so deserialization is done explicitly
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
        requestObject.body = typeHeader === internals.typeHeader.JSON ? JSON.stringify(body) : body
      }

      requestObject.headers = { 'Content-Type': typeHeader }

      Request(requestObject, requestCallback(reject, method, uri, resolve, throwOnNotFound))
    })
  }
}

module.exports = {
  /**
   * To process CRUD requests against the data model
   * @param auth - The authorization where needed by the API
   * @param method - One of the HTTP method verbs
   * @param path - the path
   * @param search - optional search criteria
   * @param body - the message body
   * @param throwOnNotFound flag to indicate that not-found 404 should throw an exception
   * @returns {Promise<*|Promise<void>>}
   */
  request: async (auth, method, path, search, body, throwOnNotFound = false) => {
    const request = internals.createRequest(path, search)
    return internals.makeRequest(auth, request, method, body, throwOnNotFound, internals.typeHeader.JSON)
  },

  /**
   * For relationship changes between entities
   * @param auth - The authorization where needed by the API
   * @param path - the path
   * @param payload
   * @returns {Promise<*|Promise<void>>}
   */
  requestAssociationChange: async (auth, path, payload) => {
    const request = internals.createRequest(path)
    return internals.makeRequest(auth, request, internals.method.PUT,
      payload, true, internals.typeHeader.ASSOC)
  },

  /**
   * For requests for objects specified by hypermedia (where a full URL is specified)
   * @param auth - The authorization where needed by the API
   * @param link - the link
   * @returns {Promise<*|Promise<void>>}
   */
  requestFromLink: async (auth, link) => {
    return internals.makeRequest(auth, link, internals.method.GET,
      null, true, internals.typeHeader.JSON)
  },

  /**
   * The file uploader - accepts a file path and (at this point) assumes a .CSV file
   * @param auth - The authorization where needed by the API
   * @param path - the path
   * @param query - any additional query parameters
   * @param filePath - the path of the file being uploaded
   * @returns {Promise<*|Promise<void>>}
   */
  requestFileUpload: async (auth, path, query, filePath) => {
    return internals.makeRequest(
      auth,
      internals.createRequest(path, query),
      internals.method.POST,
      Fs.createReadStream(filePath),
      true,
      internals.typeHeader.CSV)
  },

  method: internals.method
}
