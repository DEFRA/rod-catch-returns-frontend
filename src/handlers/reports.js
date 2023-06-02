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
    // await aws.reportLocationExists()
    // const reportsList = await aws.listReports()
    const reportsList = [{
      description: 'Sample report',
      contentType: 'Sample content',
      length: '56,000',
      lastModified: '2023-06-02T11:33:00.000',
      key: 'skeleton'
    }]
    return this.readCacheAndDisplayView(request, h, { reports: reportsList })
  }
}
