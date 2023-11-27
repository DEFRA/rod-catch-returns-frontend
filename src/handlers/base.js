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
        return await this.doGet(request, h)
      } else {
        if (this.validator) {
          errors = await this.validator(request, h)
        }
        return await this.doPost(request, h, errors)
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

  /**
   * If there are errors then append the errors and the original payload to the
   * cache and redirect to the errorPath. Otherwise remove the errors and payload
   * object from the cache and rewrite the cache
   * @param request
   * @param h
   * @param errors
   * @param successPath
   * @param errorPath
   * @param c
   * @returns {Promise<*>}
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

    if (cache[this.context]) {
      delete cache[this.context]
    }

    await request.cache().set(cache)
    return h.redirect(successPath)
  }

  /**
   * Append any errors and payload found in the cache object to
   * the page view
   * @param request
   * @param h
   * @param pageObj - An object for use in the page template.
   * @returns {Promise<never>}
   */
  async readCacheAndDisplayView (request, h, pageObj) {
    if (!pageObj) {
      return h.view(this.path)
    }

    if (typeof pageObj !== 'object' || Array.isArray(pageObj)) {
      throw new Error('Page object must be an object')
    }

    const cache = await request.cache().get()
    let pageObj2
    if (cache[this.context] && (cache[this.context].payload || cache[this.context].errors)) {
      pageObj2 = Object.assign(pageObj, {
        payload: cache[this.context].payload,
        errors: cache[this.context].errors
      })
    }

    return h.view(this.path, Object.assign(pageObj2 || pageObj, { fmt: process.env.CONTEXT === 'FMT' }))
  }

  /**
   * Helper function to return the current local context of the cache
   * @param request
   * @returns {Promise<void>}
   */
  async getCacheContext (request) {
    const cache = await request.cache().get()
    return cache[this.context] || {}
  }

  /**
   * Helper function to set the cache withing the local context
   * @param request
   * @param obj
   * @returns {Promise<void>}
   */
  async setCacheContext (request, obj) {
    const cache = await request.cache().get()
    cache[this.context] = obj
    await request.cache().set(cache)
  }

  /**
   * @param request
   * Just clear the errors
   */
  async clearCacheErrors (request) {
    const cache = await request.cache().get()
    if (cache[this.context] && cache[this.context].errors) {
      delete cache[this.context].errors
      await request.cache().set(cache)
    }
    return cache
  }

  /**
   * @param request
   * Just clear the payload
   */
  async clearCachePayload (request) {
    const cache = await request.cache().get()
    if (cache[this.context] && cache[this.context].payload) {
      delete cache[this.context].payload
      await request.cache().set(cache)
    }
    return cache
  }

  /**
   * Clears the context
   *
   * Allow handlers to clear the cache for a
   * canceled activity.
   * @param request
   * @returns {Promise<*>}
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
