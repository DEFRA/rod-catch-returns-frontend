'use strict'

const BaseHandler = require('./base')
const RiversApi = require('../api/rivers')
const SubmissionsApi = require('../api/submissions')
const ActivitiesApi = require('../api/activities')
const ResponseError = require('./response-error')
const isAllowedParam = require('./common').isAllowedParam
const testLocked = require('./common').testLocked

const submissionsApi = new SubmissionsApi()
const riversApi = new RiversApi()
const activitiesApi = new ActivitiesApi()

class ActivitiesHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  async add (request, h, cache, activities, rivers, maxDaysFished) {
    delete cache.activity
    cache.back = request.path
    await request.cache().set(cache)

    // Filter out the rivers already selected
    return this.readCacheAndDisplayView(request, h, {
      rivers: rivers.filter(r => !activities.map(a => a.river.id).includes(r.id)),
      add: true,
      details: {
        licenceNumber: cache.licenceNumber,
        postcode: cache.postcode,
        year: cache.year,
        maxDaysFished
      }
    })
  }

  async change (request, h, cache, activities, rivers, maxDaysFished, submission) {
    let activity = await activitiesApi.getById(request, `activities/${request.params.id}`)

    if (!activity) {
      throw new ResponseError.Error('unknown activity', ResponseError.status.UNAUTHORIZED)
    }

    const activitySubmission = await submissionsApi.getFromLink(request, activity._links.submission.href)
    activity = await activitiesApi.doMap(request, activity)

    // Check they are not messing about with somebody else's activity
    if (activitySubmission.id !== submission.id) {
      throw new ResponseError.Error('Action attempted on not owned submission', ResponseError.status.UNAUTHORIZED)
    }

    // Write the catch id onto the cache
    cache.activity = { id: activity.id }
    cache.back = request.path
    await request.cache().set(cache)

    // Prepare a the payload
    const payload = {
      river: activity.river.id,
      daysFishedOther: activity.daysFishedOther,
      daysFishedWithMandatoryRelease: activity.daysFishedWithMandatoryRelease
    }

    /*
     * Do not allow to switch to a river that is already in the submission other than the
     * one we are currently editing
     */
    return this.readCacheAndDisplayView(request, h, {
      rivers: rivers.filter(r => ![].concat(...activities.map(a => a.river))
        .filter(r => r.id !== activity.river.id)
        .map(r2 => r2.id).includes(r.id)).sort(riversApi.sort),
      payload: payload,
      details: {
        licenceNumber: cache.licenceNumber,
        postcode: cache.postcode,
        year: cache.year,
        maxDaysFished
      }
    })
  }

  /**
   * Get handler for add activity page
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
    const submission = await submissionsApi.getById(request, cache.submissionId)
    const activities = await activitiesApi.getFromLink(request, submission._links.activities.href)
    const rivers = (await riversApi.list(request))
      .filter(r => process.env.CONTEXT === 'FMT' ? true : !r.internal).sort(riversApi.sort)

    // If it's a leap year, set the max number of days fished to 168 instead of 167
    const maxDaysFished = submission.season % 4 === 0 ? 168 : 167

    // Test if the submission is locked and if so redirect to the review screen
    if (await testLocked(request, cache, submission)) {
      return h.redirect('/review')
    }

    return (request.params.id === 'add')
      ? this.add(request, h, cache, activities, rivers, maxDaysFished)
      : this.change(request, h, cache, activities, rivers, maxDaysFished, submission)
  }

  /**
   * post handler for the add activity page
   * @param request
   * @param h
   * @param errors
   * @returns {Promise<*>}
   */
  async doPost (request, h, errors) {
    return this.writeCacheAndRedirect(request, h, errors, '/summary',
      `/activities/${encodeURIComponent(request.params.id)}`)
  }
}

class ActivitiesHandlerClear extends ActivitiesHandler {
  async doGet (request, h) {
    await this.clearCacheErrorsAndPayload(request)
    return super.doGet(request, h)
  }
}

module.exports = { ActivitiesHandler, ActivitiesHandlerClear }
