'use strict'

/**
 * Small catch handler
 */
const Moment = require('moment')

const BaseHandler = require('./base')
const MethodsApi = require('../api/methods')
const SubmissionsApi = require('../api/submissions')
const SmallCatchesApi = require('../api/small-catches')
const ActivitiesApi = require('../api/activities')
const ResponseError = require('./response-error')

const testLocked = require('./common').testLocked
const isAllowedParam = require('./common').isAllowedParam

const submissionsApi = new SubmissionsApi()
const smallCatchesApi = new SmallCatchesApi()
const activitiesApi = new ActivitiesApi()
const methodsApi = new MethodsApi()

// Calculate calendar months
const months = [...Array(12).keys()].map(m => {
  const mth = Moment({ month: m }).format('MMMM')
  return {
    value: mth.toUpperCase(),
    text: mth
  }
})

module.exports = class SmallCatchHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for select salmon and large trout page
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
    cache.back = request.path
    const submission = await submissionsApi.getById(request, cache.submissionId)
    const activities = await activitiesApi.getFromLink(request, submission._links.activities.href)

    // Filter rivers and methods by the internal only
    let rivers = activities.map(a => a.river)
      .filter(r => process.env.CONTEXT === 'FMT' ? true : !r.internal)
    const methods = (await methodsApi.list(request))
      .filter(r => process.env.CONTEXT === 'FMT' ? true : !r.internal)

    // Test if the submission is locked and if so redirect to the review screen
    if (await testLocked(request, cache, submission)) {
      return h.redirect('/review')
    }

    if (request.params.id === 'add') {
      // Clear any existing catch id
      delete cache.smallCatch
      await request.cache().set(cache)
      let monthsFiltered

      // If we only have one river or we are doing add again then filter the months
      if (rivers.length === 1 || cache.add) {
        if (cache.add && cache.add.river) {
          // Filter to single river and filter the allowed months
          rivers = rivers.filter(r => r.id === cache.add.river)
        }
        const smallCatches = await smallCatchesApi.getAllChildren(request, activities, '_links.smallCatches.href')
        const activity = activities.find(a => a.river.id === rivers[0].id)
        const monthsSelected = smallCatches.filter(s => s.activity.id === activity.id).map(m => m.month)
        monthsFiltered = months.filter(m => !monthsSelected.includes(m.value))
        if (monthsFiltered.length === 0) {
          return h.redirect('/summary')
        }
      }

      // Add a new salmon and large trout
      return this.readCacheAndDisplayView(request, h, {
        rivers: rivers,
        methods: methods,
        add: true,
        details: {
          licenceNumber: cache.licenceNumber,
          postcode: cache.postcode,
          year: cache.year
        }
      })
    } else {
      // Modify an existing catch
      let smallCatch = await smallCatchesApi.getById(request, `smallCatches/${request.params.id}`)
      if (!smallCatch) {
        throw new ResponseError.Error('Unauthorized access to small catch', ResponseError.status.UNAUTHORIZED)
      }
      // Check they are not messing about with somebody else's activity
      if (!activities.map(a => a._links.self.href).includes(smallCatch._links.activityEntity.href)) {
        throw new ResponseError.Error('Unauthorized access to large catch', ResponseError.status.UNAUTHORIZED)
      }
      smallCatch = await smallCatchesApi.doMap(request, smallCatch)

      // Write the catch id onto the cache
      cache.smallCatch = { id: smallCatch.id }
      await request.cache().set(cache)

      const payload = {
        river: smallCatch.activity.river.id,
        released: smallCatch.released,
        month: smallCatch.month,
        noMonthRecorded: smallCatch.noMonthRecorded
      }

      smallCatch.counts.forEach(t => {
        payload[t.name.toLowerCase()] = t.count
      })

      return this.readCacheAndDisplayView(request, h, {
        rivers: rivers,
        methods: methods,
        payload: payload,
        details: {
          licenceNumber: cache.licenceNumber,
          postcode: cache.postcode,
          year: cache.year
        }
      })
    }
  }

  /**
   * Post handler for the small catch
   * @param request
   * @param h
   * @param errors
   * @returns {Promise<*>}
   */
  async doPost (request, h, errors) {
    // If we are adding again store the river
    let next
    const cache = await request.cache().get()

    // Clear the submission level exclude flag
    if (!errors) {
      const submission = await submissionsApi.getById(request, cache.submissionId)
      if (submission.reportingExclude) {
        await submissionsApi.changeExclusion(request, submission.id, false)
      }
    }

    if (Object.keys(request.payload).includes('add')) {
      next = '/small-catches/add'
      cache.add = { river: request.payload.river }
    } else {
      next = '/summary'
      delete cache.add
    }

    return this.writeCacheAndRedirect(request, h, errors, next,
      `/small-catches/${encodeURIComponent(request.params.id)}`, cache)
  }
}
