'use strict'

/**
 * Display the Records Search Results page
 */
const BaseHandler = require('./base')
const SubmissionsApi = require('../api/submissions')

const submissionsApi = new SubmissionsApi()

module.exports = class RecordsSearchResultsHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for records
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const submissions = await submissionsApi.getByContactId(request, request.query.contactId)
    return h.view(this.path,{
        submissions
    })
  }

  /**
   * Post handler for records
   * @param request
   * @param h
   * @param errors
   * @returns {Promise<*>}
   */
  async doPost (request, h) {
    return h.view(this.path)
  }
}
