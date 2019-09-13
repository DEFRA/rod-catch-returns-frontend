'use strict'

const EntityApi = require('./entity-api')
const ActivityApi = require('../api/activities')
const RiversApi = require('../api/rivers')
const MethodsApi = require('../api/methods')
const ResponseError = require('../handlers/response-error')
const monthUtils = require('../handlers/common').monthHelper

const activityApi = new ActivityApi()
const riversApi = new RiversApi()
const methodsApi = new MethodsApi()

/**
 * Small catches entity handler
 *
 */
module.exports = class SmallCatchesApi extends EntityApi {
  constructor () {
    super('smallCatches', async (request, c) => {
      const activity = await activityApi.getFromLink(request, c._links.activity.href)
      const river = await riversApi.getFromLink(request, activity._links.river.href)
      const methods = await methodsApi.list(request)
      const counts = await Promise.all(c.counts.map(async m => {
        return {
          method: await methodsApi.doMap(request, await methodsApi.getFromLink(request, m._links.method.href)), count: m.count
        }
      }))
      return {
        id: EntityApi.keyFromLink(c),
        month: monthUtils.find.numFromKey(c.month),
        counts: methods.map(m => {
          const methodCount = counts.find(c => c.method.name === m.name)
          return { id: m.id, name: m.name, count: methodCount ? methodCount.count : null, internal: m.internal }
        }),
        reportingExclude: c.reportingExclude,
        released: c.released,
        noMonthRecorded: c.noMonthRecorded,
        activity: {
          id: EntityApi.keyFromLink(activity),
          days: activity.days,
          river: {
            id: EntityApi.keyFromLink(river),
            name: river.name
          }
        }
      }
    })
  }

  async add (request, submissionId, activityId, month, counts, released, noMonthRecorded) {
    return super.add(request, {
      submission: submissionId,
      activity: activityId,
      month: monthUtils.find.keyFromNum(month),
      released: released,
      counts: counts,
      noMonthRecorded: noMonthRecorded
    })
  }

  async change (request, catchId, activityId, month, counts, released, noMonthRecorded) {
    const result = await super.change(request, catchId, {
      month: monthUtils.find.keyFromNum(month),
      released: released,
      counts: counts,
      noMonthRecorded: noMonthRecorded
    })

    // Return early with errors
    if (Object.keys(result).includes('errors')) {
      return result
    }

    const mappedResult = await this.doMap(request, result)

    // Change the activity if necessary. If there is a conflict treat it as a duplicate
    if (mappedResult.activity.id !== activityId) {
      const changeResult = await super.changeAssoc(request, catchId + '/activity', activityId)
      if (changeResult.statusCode && changeResult.statusCode === ResponseError.status.CONFLICT) {
        return {
          errors: [
            {
              entity: 'SmallCatch',
              message: 'SMALL_CATCH_DUPLICATE_FOUND'
            }
          ]
        }
      }
    }

    return result
  }

  async changeExclusion (request, catchId, reportingExclude) {
    return super.change(request, catchId, {
      reportingExclude: reportingExclude
    })
  }

  sort (a, b) {
    if (a.month < b.month) {
      return -1
    }

    if (a.month > b.month) {
      return 1
    }

    if (a.activity.river.name < b.activity.river.name) {
      return -1
    }

    if (a.activity.river.name > b.activity.river.name) {
      return 1
    }

    return 0
  }
}
