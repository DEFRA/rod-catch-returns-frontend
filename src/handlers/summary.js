'use strict'

/**
 * Summary handler
 */
const BaseHandler = require('./base')
const SubmissionsApi = require('../api/submissions')

const { testLocked } = require('./common')
const displayData = require('./display-data')

const submissionsApi = new SubmissionsApi()

module.exports = class SummaryHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for the summary page
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    // Clean the cache
    const cache = await this.clearCacheErrorsAndPayload(request)

    // Find or create a submission object
    const submission = await submissionsApi.getById(request, cache.submissionId)

    // Test if the submission is locked and if so redirect to the review screen
    if (await testLocked(request, cache, submission)) {
      return h.redirect('/review')
    }

    // Set the submissionId in the cache
    cache.submissionId = submission.id
    cache.back = request.path
    await request.cache().set(cache)

    const { activities, catches, smallCatches, foundInternal } = await displayData(request, submission)

    // Return the summary view
    return h.view(this.path, {
      year: cache.year,
      activities: activities,
      catches: catches,
      smallCatches: smallCatches,
      reportingExclude: submission.reportingExclude,
      foundInternal: foundInternal,
      details: {
        licenceNumber: cache.licenceNumber,
        postcode: cache.postcode,
        year: cache.year
      }
    })
  }

  /**
   * Post handler for the summary page. In the case of the FMT user the
   * exclusions need to be saved, otherwise just progress to the review page
   * @param request. No validation is required
   * @param h
   * @param errors
   * @returns {Promise<*>}
   */
  async doPost (request, h) {
    if (process.env.CONTEXT === 'FMT') {
      if (Object.keys(request.payload).includes('save')) {
        return h.redirect('/save')
      }
    }

    return h.redirect('/review')
  }
}
