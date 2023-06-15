'use strict'

/**
 * Display the FMT users reports page
 */
const BaseHandler = require('./base')
const aws = require('../lib/aws')

module.exports = class ReportsHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for reports
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    await aws.reportLocationExists()
    const reports = await aws.listReports()
    return this.readCacheAndDisplayView(request, h, { reports })
  }
}
