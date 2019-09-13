'use strict'

/**
 * Display the declaration page
 */
const BaseHandler = require('./base')
const SubmissionsApi = require('../api/submissions')
const submissionsApi = new SubmissionsApi()
const displayData = require('./display-data')

module.exports = class ReviewHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for main page
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    return this.reviewReturn(request, h)
  }

  async reviewReturn (request, h) {
    const cache = await request.cache().get()
    cache.back = request.path
    await request.cache().set(cache)

    const submission = await submissionsApi.getById(request, cache.submissionId)

    const { activities, catches, smallCatches, foundInternal } = await displayData(request, submission)

    // Return the review details
    return h.view(this.path, {
      year: cache.year,
      activities: activities,
      catches: catches,
      smallCatches: smallCatches,
      foundInternal: foundInternal,
      locked: !!cache.locked,
      reportingExclude: submission.reportingExclude,
      details: {
        licenceNumber: cache.licenceNumber,
        postcode: cache.postcode,
        year: cache.year
      }
    })
  }

  /**
   * Sets the finalize statue for the rod catch return
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  async doPost (request, h) {
    if (Object.keys(request.payload).includes('continue')) {
      const cache = await request.cache().get()
      cache.locked = true
      await request.cache().set(cache)
      await submissionsApi.setSubmitted(request, cache.submissionId)
      return h.redirect('/confirmation')
    } else if (Object.keys(request.payload).includes('unlock') && process.env.CONTEXT === 'FMT') {
      const cache = await request.cache().get()
      cache.locked = false
      await request.cache().set(cache)
      await submissionsApi.setIncomplete(request, cache.submissionId)
      return h.redirect('/summary')
    } else {
      throw new Error('Lock operation not permitted')
    }
  }
}
