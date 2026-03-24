'use strict'

const moment = require('moment')
/**
 * Display the saved data message.
 * N.B. This does not save anything!
 */
const BaseHandler = require('./base')

module.exports = class SaveHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * If external user zap the session and display the save page. If a
   * fish management team user then just go back to teh licence selector
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const now = moment()
    const cache = await request.cache().get()

    const catchReturns = new URL(process.env.CATCH_RETURNS_GOV_UK)
    const catchReturnsRef = catchReturns.toString()
    const catchReturnsLink = catchReturns.hostname + catchReturns.pathname

    if (process.env.CONTEXT === 'ANGLER') {
      await request.cache().drop()
      request.cookieAuth.clear()
    }

    return h.view(this.path, {
      extendPeriod: Number.parseInt(cache.year) === now.year() - 1,
      catchReturnsRef,
      catchReturnsLink,
      year: cache.year,
      fmt: process.env.CONTEXT === 'FMT'
    })
  }
}
