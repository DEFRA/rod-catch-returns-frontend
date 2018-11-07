'use strict'

/**
 * Base controller class.
 *
 * It handles errors and calls the assigned validator on post
 * The async preValidateFunction can be used to operate on the payload before
 * validation if exists
 */
const { logger } = require('defra-logging-facade')

module.exports = class BaseHandler {
  constructor ([viewpath, validator]) {
    this.path = viewpath
    this.validator = validator
    this.handler = async (request, h) => {
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
        if (err instanceof require('../lib/crypto').cryptoError) {
          logger.error(err)
          return h.redirect('/')
        }

        if (err.statusCode === 403) {
          // Attempt to access unauthorized resources - don't log
          return h.redirect('/error403')
        } else {
          // Server errors
          logger.error(err)
          return h.view('error500')
        }
      }
    }
  }

  /*
   * If there are errors then append the errors and the original payload to the
   * cache and redirect to the errorPath. Otherwise remove the errors and payload
   * object from the cache and rewrite the cache
   */
  static async writeCacheAndRedirect (request, h, errors, successPath, errorPath, c) {
    if (errors) {
      // Write the errors into the cache
      let cache = c || await request.cache().get()
      cache.errors = errors
      cache.payload = request.payload
      await request.cache().set(cache)
      return h.redirect(errorPath)
    }
    let cache = c || await request.cache().get()
    if (cache.errors || cache.payload) {
      delete cache.errors
      delete cache.payload
    }
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

    let cache = await request.cache().get()
    if (cache.payload || cache.errors) {
      pageObj = Object.assign(pageObj, { payload: cache.payload, errors: cache.errors })
    }
    // Tell the page if we are fmt
    return h.view(this.path, Object.assign(pageObj, { fmt: process.env.CONTEXT === 'FMT' }))
  }

  /*
   * Allow handlers to clear the cache for a
   * canceled activity
   */
  static async clearCacheErrorsAndPayload (request) {
    let cache = await request.cache().get()
    if (cache.errors || cache.payload || cache.add) {
      delete cache.errors
      delete cache.payload
      delete cache.add
      await request.cache().set(cache)
    }
    return cache
  }
}
