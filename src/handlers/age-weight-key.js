'use strict'
const logger = require('../lib/logger-utils')
const Fs = require('fs')
const moment = require('moment')
/**
 * Display the age weight key upload page
 */
const BaseHandler = require('./base')
const GatesApi = require('../api/gates')

const gatesApi = new GatesApi()

module.exports = class AgeWeightKeyHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  removeTempFile (request) {
    if (request.payload.upload) {
      Fs.unlinkSync(request.payload.upload.path)
      logger.debug(`Removed temporary file: ${request.payload.upload.path}`)
    }
  }

  /**
   * Get handler for age weight key upload
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    // If from the navigation menu then clear the whole context including the ageWeightKey
    if (request.query.clear) {
      await this.clearCacheErrorsAndPayload(request)
    }

    const gates = (await gatesApi.list(request)).map(e => ({ id: e.id, name: e.name }))

    const now = moment()
    const years = [-2, 2].map(y => (now.year() + y).toString())

    return this.readCacheAndDisplayView(request, h, { gates, years })
  }

  /**
   * Called after the validator and:
   * (1) Writes any errors and payload into the cache
   * (2) Redirects to the ok to overwrite dialog if there is a conflict
   * (3) Directs back to self (get) of the OK page depending on the error state
   *
   * Note: request.payload.upload.path is the temporary file while
   * request.payload.upload.filename is the filename
   *
   * @param request
   * @param h
   * @param errors
   * @returns {Promise<Promise<*|*>|*>}
   */
  async doPost (request, h, errors) {
    const gate = (await gatesApi.list(request)).filter(e => e.id === request.payload.gate)[0]
    const cacheContext = await this.getCacheContext(request)

    cacheContext.ageWeightKey = {
      year: request.payload.year,
      gateName: gate ? gate.name : '',
      gateId: gate ? gate.id : ''
    }

    if (request.payload.upload) {
      cacheContext.ageWeightKey.tempfile = request.payload.upload.path
      cacheContext.ageWeightKey.filename = request.payload.upload.filename
    }

    cacheContext.errors = errors
    cacheContext.payload = request.payload

    await this.setCacheContext(request, cacheContext)

    if (errors) {
      if (errors.find(e => e.type === 'OVERWRITE_DISALLOWED')) {
        await this.clearCacheErrors(request)
        return h.redirect('/age-weight-key-conflict-check')
      }

      this.removeTempFile(request)
      return this.writeCacheAndRedirect(request, h, errors, null, '/age-weight-key')
    }

    // Leave the ageWeightKey in place on the cache as it is needed by the OK page
    this.removeTempFile(request)
    await this.clearCachePayload(request)
    await this.clearCacheErrors(request)

    return h.redirect('/age-weight-key-ok')
  }
}
