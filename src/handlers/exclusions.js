'use strict'
const SubmissionsApi = require('../api/submissions')
const ActivitiesApi = require('../api/activities')
const CatchesApi = require('../api/catches')
const SmallCatchesApi = require('../api/small-catches')

const submissionsApi = new SubmissionsApi()
const activitiesApi = new ActivitiesApi()
const catchesApi = new CatchesApi()
const smallCatchesApi = new SmallCatchesApi()

/**
 * Write the state of the exclusions flags into the cache
 */
const BaseHandler = require('./base')

module.exports = class ExclusionsHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Post handler for exclusion flags
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doPost (request, h) {
    const response = {}
    const cache = await request.cache().get()
    const submission = await submissionsApi.getById(request, cache.submissionId)
    const activities = await activitiesApi.getFromLink(request, submission._links.activities.href)
    const catches = await catchesApi.getAllChildren(request, activities, '_links.catches.href')
    const smallCatches = smallCatchesApi.getAllChildren(request, activities, '_links.smallCatches.href')

    const payloadKey = Object.keys(request.payload)[0]
    const setting = request.payload[payloadKey] === 'true'

    if (payloadKey === 'exclude-1') {
      /**
       * Deal with the setting and unsetting of the submission level flag
       * cascade to the large and small catch line items
       */
      // Change the submission level exclusion if necessary
      if (submission.reportingExclude !== setting) {
        await submissionsApi.changeExclusion(request, submission.id, setting)
      }
    } else {
      /**
       * Deal with the item level flags and set the submission level flag if all flags are set
       * or clear it if we it is already set and we are un-setting an item level flag
       * @type {string}
       */
      const key = payloadKey.replace('exclude-', '')

      // Set the item level exclusion flags
      if (payloadKey.includes('smallCatches')) {
        const smallCatch = smallCatches.find(c => c.id === key)
        if (smallCatch && smallCatch.reportingExclude !== setting) {
          await smallCatchesApi.changeExclusion(request, key, setting)
          smallCatch.reportingExclude = setting
        }
      } else if (payloadKey.includes('catches')) {
        const largeCatch = catches.find(c => c.id === key)
        if (largeCatch && largeCatch.reportingExclude !== setting) {
          await catchesApi.changeExclusion(request, key, setting)
          largeCatch.reportingExclude = setting
        }
      }
    }

    return response
  }
}
