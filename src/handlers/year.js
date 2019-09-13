'use strict'

const moment = require('moment')

/**
 * Year handler
 */
const BaseHandler = require('./base')

module.exports = class YearHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for select year page
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const now = moment()
    const years = []
    if ([0, 1, 2].includes(now.month()) || process.argv.includes('--force-year-choose') || process.env.NODE_ENV === 'test') {
      // Select the year
      years.push({ value: now.year() - 1, text: (now.year() - 1).toString() })
      years.push({ value: now.year(), text: (now.year()).toString() })
      const cache = await request.cache().get()
      return this.readCacheAndDisplayView(request, h, {
        years,
        details: {
          licenceNumber: cache.licenceNumber,
          postcode: cache.postcode
        } })
    } else {
      const cache = await request.cache().get()
      cache.year = now.year()
      await request.cache().set(cache)
      return h.redirect('/did-you-fish')
    }
  }

  /**
   * Post handler for the select year page
   * @param request
   * @param h
   * @param errors
   * @returns {Promise<*>}
   */
  async doPost (request, h, errors) {
    // Save the year
    if (!errors) {
      const cache = await request.cache().get()
      cache.year = request.payload.year.toString()
      await request.cache().set(cache)
    }

    return this.writeCacheAndRedirect(request, h, errors, '/did-you-fish', '/select-year')
  }
}
