'use strict'

/**
 * Base controller class.
 *
 * It handles errors and calls the assigned validator on post
 * The async preValidateFunction can be used to operate on the payload before
 * validation if exists
 */
const { logger } = require('defra-logging-facade')
const CryptoError = require('../lib/crypto').cryptoError
const ResponseError = require('./response-error')

module.exports = class BaseHandler {
  constructor ([viewpath, validator, context]) {
    this.path = viewpath
    this.validator = validator
    this.context = context || 'defaultContext'
    this.handler = this.handler.bind(this)
  }

  /**
   * This is the high level handler function
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  async handler (request, h) {
    try {
      let errors
      if (request.method.toUpperCase() === 'GET') {
        return this.doGet(request, h)
      } else {
        if (this.validator) {
          errors = await this.validator(request, h)
        }
        return this.doPost(request, h, errors)
      }
    } catch (err) {
      // Crypto error
      if (err instanceof CryptoError) {
        logger.error(err)
        return h.redirect('/')
      }

      // Response error
      if (err instanceof ResponseError.Error) {
        logger.debug(err)
        return h.redirect(`/error/${err.statusCode}`)
      } else {
        throw err
      }
    }
  }

  /*
   * If there are errors then append the errors and the original payload to the
   * cache and redirect to the errorPath. Otherwise remove the errors and payload
   * object from the cache and rewrite the cache
   */
  async writeCacheAndRedirect (request, h, errors, successPath, errorPath, c) {
    const cache = c || await request.cache().get()

    if (errors) {
      // Write the errors into the cache
      cache[this.context] = cache[this.context] || {}
      cache[this.context].errors = errors
      cache[this.context].payload = request.payload
      await request.cache().set(cache)
      return h.redirect(errorPath)
    }

    if (cache[this.context]) delete cache[this.context]

    await request.cache().set(cache)
    return h.redirect(successPath)
  }

  /*
   * Append any errors and payload found in the cache object to
   * the page view
   */
  async readCacheAndDisplayView (request, h, pageObj) {
    if (!pageObj) {
      return h.view(this.path)
    }

    if (typeof pageObj !== 'object' || Array.isArray(pageObj)) {
      throw new Error('Page object must be an object')
    }

    const cache = await request.cache().get()
    if (cache[this.context] && (cache[this.context].payload || cache[this.context].errors)) {
      pageObj = Object.assign(pageObj, {
        payload: cache[this.context].payload,
        errors: cache[this.context].errors
      })
    }

    return h.view(this.path, Object.assign(pageObj, { fmt: process.env.CONTEXT === 'FMT' }))
  }

  /*
   * Allow handlers to clear the cache for a
   * canceled activity
   */
  async clearCacheErrorsAndPayload (request) {
    const cache = await request.cache().get()
    if (cache[this.context]) {
      delete cache[this.context]
      await request.cache().set(cache)
    }
    return cache
  }
}
