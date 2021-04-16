'use strict'

/**
 * Display the Records Submissions page
 */
const BaseHandler = require('./base')
const SubmissionsApi = require('../api/submissions')
const submissionsApi = new SubmissionsApi()
const displayData = require('./display-data')

module.exports = class RecordsSubmissionsHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for records
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const cache = await request.cache().get()
    if (!cache.recordsSubmissionId) {
      return h.redirect('/records')
    }

    const submission = await submissionsApi.getById(request, cache.recordsSubmissionId)

    const { activities, catches, smallCatches, foundInternal } = await displayData(request, submission)

    // Return the review details
    return h.view(this.path, {
      fullName: cache.fullName,
      year: cache.recordsYear,
      activities: activities,
      catches: catches,
      smallCatches: smallCatches,
      foundInternal: foundInternal
    })
  }
}
