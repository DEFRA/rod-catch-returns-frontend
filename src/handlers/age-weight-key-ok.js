'use strict'

const moment = require('moment')

/**
 * Confirm page for age weight key uploads
 */
const BaseHandler = require('./base')

module.exports = class AgeWeightKeyOkHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Confirm page for age weight key uploads
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const cacheContext = await this.getCacheContext(request)
    const now = moment().format('dddd Do MMMM YYYY [at] h:mma')

    return this.readCacheAndDisplayView(request, h, { ageWeightKey: cacheContext.ageWeightKey, now })
  }
}
