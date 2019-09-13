'use strict'

/**
 * The lookup handler - direct route into submission for the FMT user
 */
const BaseHandler = require('./base')
const SubmissionsApi = require('../api/submissions')
const ResponseError = require('./response-error')
const submissionsApi = new SubmissionsApi()

module.exports = class SaveHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Set up the cache data and redirect to the appropriate page
   * the page is determined by a query string
   * lookup?submissionId=id{&[activityId=id|catchId=id|smallCatchId=id]}
   *
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const submission = await submissionsApi.getById(request, request.query.submissionId)
    if (!submission) {
      throw new ResponseError.Error('Bad submission request', ResponseError.status.NOT_FOUND)
    }

    const cache = await request.cache().get()
    cache.contactId = submission.contactId
    cache.year = submission.season
    cache.submissionId = request.query.submissionId
    cache.back = '/summary'
    delete cache.licenceNumber
    delete cache.postcode
    await request.cache().set(cache)

    if (request.query.activityId) {
      return h.redirect(request.query.activityId)
    }

    if (request.query.smallCatchId) {
      return h.redirect(`/small-catches/${request.query.smallCatchId.split('/')[1]}`)
    }

    if (request.query.catchId) {
      return h.redirect(`/catches/${request.query.catchId.split('/')[1]}`)
    }

    return h.redirect('/summary')
  }
}
