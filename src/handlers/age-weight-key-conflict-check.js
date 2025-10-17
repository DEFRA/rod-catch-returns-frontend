'use strict'
const { logger } = require('defra-logging-facade')
const Fs = require('fs')
/**
 * Display the age weight key conflict check
 */
const BaseHandler = require('./base')
const AgeWeightKeyApi = require('../api/age-weight-key')

module.exports = class AgeWeightKeyConflictCheck extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  removeTempFile (filepath) {
    Fs.unlinkSync(filepath)
    logger.debug(`Removed temporary file: ${filepath}`)
  }

  /**
   * Get handler for age weight key error breakdown
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const cacheContext = await this.getCacheContext(request)

    const gate = cacheContext.ageWeightKey.gateName
    const year = cacheContext.ageWeightKey.year

    return this.readCacheAndDisplayView(request, h, { gate, year })
  }

  async doPost (request, h, errors) {
    const cacheContext = await this.getCacheContext(request)

    /*
     * If errors on this page write payload and errors and get again
     * Need to preserve the ageWeightKey in the cache
     */
    if (errors) {
      cacheContext.errors = errors
      cacheContext.payload = request.payload
      await this.setCacheContext(request, cacheContext)
      return h.redirect('/age-weight-key-conflict-check')
    }

    /*
     * Otherwise if chosen that overwrite is yes then load the file
     * clear the errors and payload but preserve the ageWeightKey on the cache
     */
    if (request.payload.overwrite === 'true') {
      await AgeWeightKeyApi.postNew(request,
        cacheContext.ageWeightKey.year, cacheContext.ageWeightKey.gateId,
        cacheContext.ageWeightKey.tempfile, true)

      logger.debug(`Uploaded age weight key file: ${cacheContext.ageWeightKey.filename}`)
      this.removeTempFile(cacheContext.ageWeightKey.tempfile)
      await this.clearCachePayload(request)
      await this.clearCacheErrors(request)

      return h.redirect('/age-weight-key-ok')
    }

    /*
     * Chosen to not overwrite so return to the main age weight page
     * clearing the entire cache context
     */
    return h.redirect('/age-weight-key?clear=true')
  }
}
