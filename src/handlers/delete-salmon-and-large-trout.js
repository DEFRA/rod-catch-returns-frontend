'use strict'

/**
 * Delete Salmon and large trout Handler
 */
const BaseHandler = require('./base')
const SubmissionsApi = require('../api/submissions')
const CatchesApi = require('../api/catches')
const ResponseError = require('./response-error')

const Moment = require('moment')
const { printWeight, testLocked } = require('./common')

const submissionsApi = new SubmissionsApi()
const catchesApi = new CatchesApi()
const isAllowedParam = require('./common').isAllowedParam

module.exports = class DeleteRiverHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for delete large catch page
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    if (!isAllowedParam(request.params.id)) {
      throw new ResponseError.Error('Unknown activity', ResponseError.status.BAD_REQUEST)
    }

    const cache = await request.cache().get()
    const largeCatch = await catchesApi.getById(request, `catches/${request.params.id}`)

    // The back button on the browser can cause this
    if (!largeCatch) {
      throw new ResponseError.Error('Unauthorized access to large catch', ResponseError.status.UNAUTHORIZED)
    }

    const submission = await submissionsApi.getFromLink(request, largeCatch._links.submission.href)

    // Check they are not messing about with somebody else's submission
    if (cache.submissionId !== submission.id) {
      throw new ResponseError.Error('Unauthorized access to large catch', ResponseError.status.UNAUTHORIZED)
    }

    // Test if the submission is locked and if so redirect to the review screen
    if (await testLocked(request, cache, submission)) {
      return h.redirect('/review')
    }

    const c = await catchesApi.doMap(request, largeCatch)
    c.dateCaught = Moment(c.dateCaught).format('DD/MM')
    c.weight = printWeight(c)

    // Save the id to delete
    cache.delete = largeCatch.id
    await request.cache().set(cache)
    return h.view(this.path, { largeCatch: c,
      details: {
        licenceNumber: cache.licenceNumber,
        postcode: cache.postcode,
        year: cache.year
      }
    })
  }

  /**
   * Post handler for the delete large catch page
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  async doPost (request, h) {
    const cache = await request.cache().get()
    await catchesApi.deleteById(request, cache.delete)
    delete cache.delete
    await request.cache().set(cache)
    return h.redirect('/summary')
  }
}
