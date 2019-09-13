'use strict'

/**
 * Delete small catch handler
 */
const DeleteCatchHandler = require('./delete-catch')
const SubmissionsApi = require('../api/submissions')
const ActivitiesApi = require('../api/activities')
const SmallCatchesApi = require('../api/small-catches')
const ResponseError = require('./response-error')

const { testLocked, monthHelper } = require('./common')
const submissionsApi = new SubmissionsApi()
const activitiesApi = new ActivitiesApi()
const smallCatchesApi = new SmallCatchesApi()
const isAllowedParam = require('./common').isAllowedParam

module.exports = class DeleteRiverHandler extends DeleteCatchHandler {
  /**
   * Get handler for delete large catch page
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    if (!isAllowedParam(request.params.id)) {
      throw new ResponseError.Error('Unknown activity', ResponseError.status.UNAUTHORIZED)
    }
    const cache = await request.cache().get()
    const smallCatch = await smallCatchesApi.getById(request, `smallCatches/${request.params.id}`)

    // The back button on the browser can cause this
    if (!smallCatch) {
      throw new ResponseError.Error('Unauthorized access to small catch', ResponseError.status.UNAUTHORIZED)
    }

    const submission = await submissionsApi.getById(request, cache.submissionId)
    const activities = await activitiesApi.getFromLink(request, submission._links.activities.href)

    // Check they are not messing about with somebody else's submission
    if (!activities.map(a => a._links.self.href).includes(smallCatch._links.activityEntity.href)) {
      throw new ResponseError.Error('Unauthorized access to small catch', ResponseError.status.UNAUTHORIZED)
    }

    // Test if the submission is locked and if so redirect to the review screen
    if (await testLocked(request, cache, submission)) {
      return h.redirect('/review')
    }

    const c = await smallCatchesApi.doMap(request, smallCatch)
    c.month = monthHelper.find.textFromNum(c.month)

    // Save the id to delete
    cache.delete = smallCatch.id
    cache.back = request.path
    await request.cache().set(cache)
    return h.view(this.path, { smallCatch: c,
      details: {
        licenceNumber: cache.licenceNumber,
        postcode: cache.postcode,
        year: cache.year
      }
    })
  }

  /**
   * Post handler for the delete small catches
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  async doPost (request, h) {
    const cache = await request.cache().get()
    await smallCatchesApi.deleteById(request, cache.delete)
    delete cache.delete
    await request.cache().set(cache)
    return h.redirect('/summary')
  }
}
