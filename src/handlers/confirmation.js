'use strict'

/**
 * Display the confirmation page
 */
const ReviewHandler = require('./review')
const SubmissionsApi = require('../api/submissions')
const submissionsApi = new SubmissionsApi()
const ResponseError = require('./response-error')

module.exports = class ConfirmHandler extends ReviewHandler {
  /**
   * Get handler confirmation page. This reuses the review details in a hidden page so that they can be easily printed
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const cache = await request.cache().get()
    const submission = await submissionsApi.getById(request, cache.submissionId)

    // If the submission status is not submitted, throw an error
    if (submission.status !== 'SUBMITTED') {
      throw new ResponseError.Error('Illegal access of the confirmation page', ResponseError.status.UNAUTHORIZED)
    }

    return this.reviewReturn(request, h)
  }
}
