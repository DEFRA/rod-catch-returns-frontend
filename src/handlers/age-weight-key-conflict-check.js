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
    const cache = await request.cache().get()
    const gate = cache.ageWeightKey.gate
    const year = cache.ageWeightKey.year

    return this.readCacheAndDisplayView(request, h, { gate, year })
  }

  async doPost (request, h, errors) {
    const overwrite = request.payload.overwrite
    const cache = await request.cache().get()
    if (overwrite === 'true') {
      const filepath = cache[this.context].payload.upload.path
      const gate = cache[this.context].payload.gate
      const year = cache[this.context].payload.year

      await AgeWeightKeyApi.postNew(request, year, gate, filepath, true)

      this.removeTempFile(filepath)

      return this.writeCacheAndRedirect(request, h, false, '/age-weight-key-ok', '')
    } else if (overwrite === 'false') {
      return this.writeCacheAndRedirect(request, h, false, '/age-weight-key', '')
    } else {
      const gate = cache.ageWeightKey.gate
      const year = cache.ageWeightKey.year

      return h.view(this.path, { gate, year, error: true })
    }
  }
}
