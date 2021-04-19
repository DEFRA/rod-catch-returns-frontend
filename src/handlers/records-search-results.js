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
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const cache = await request.cache().get()
    if (!cache.recordsContactId) {
      return h.redirect('/records')
    }
    const submissions = await submissionsApi.getByContactId(request, cache.recordsContactId)

    return h.view(this.path, {
      submissions,
      fullName: cache.fullName
    })
  }

  async doPost (request, h) {
    const cache = await request.cache().get()
    cache.recordsSubmissionId = request.payload.submissionId

    await request.cache().set(cache)

    return h.redirect('/records-submissions')
  }
}
