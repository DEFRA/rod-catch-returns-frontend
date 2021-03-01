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
   * Get handler for records search results
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const cache = await request.cache().get()
    const submissions = await submissionsApi.getByContactId(request, cache.contactId)

    delete cache.contactId
    await request.cache().set(cache)

    return h.view(this.path, {
      submissions
    })
  }
}
