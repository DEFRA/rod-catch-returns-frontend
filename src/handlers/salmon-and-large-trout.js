'use strict'

/**
 * Salmon and large trout handler
 */
const Moment = require('moment')

const BaseHandler = require('./base')
const MethodsApi = require('../api/methods')
const SpeciesApi = require('../api/species')
const SubmissionsApi = require('../api/submissions')
const CatchesApi = require('../api/catches')
const ActivitiesApi = require('../api/activities')
const ResponseError = require('./response-error')

const testLocked = require('./common').testLocked
const isAllowedParam = require('./common').isAllowedParam

const submissionsApi = new SubmissionsApi()
const catchesApi = new CatchesApi()
const activitiesApi = new ActivitiesApi()
const methodsApi = new MethodsApi()
const speciesApi = new SpeciesApi()

class SalmonAndLargeTroutHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get request calls this method to gather the data needed for the add large catch operation
   * @param request
   * @param h
   * @param cache
   * @param rivers
   * @param methods
   * @returns {Promise<never>}
   */
  async add (request, h, cache, rivers, methods) {
    // Clear any existing catch id
    delete cache.largeCatch
    await request.cache().set(cache)

    // If are doing add again then filter the rivers
    if (cache.add && cache.add.river) {
      rivers = rivers.filter(r => r.id === cache.add.river)
    }

    // Add a new salmon and large trout
    return this.readCacheAndDisplayView(request, h, {
      rivers: rivers,
      year: cache.year,
      types: await speciesApi.list(request),
      methods: methods,
      add: true,
      details: {
        licenceNumber: cache.licenceNumber,
        postcode: cache.postcode,
        year: cache.year
      }
    })
  }

  /**
   * Get request calls this method to gather the data needed for the change large catch operation
   * @param request
   * @param h
   * @param cache
   * @param rivers
   * @param methods
   * @param activities
   * @returns {Promise<never>}
   */
  async change (request, h, cache, rivers, methods, activities) {
    // Modify an existing catch
    let largeCatch = await catchesApi.getById(request, `catches/${request.params.id}`)
    if (!largeCatch) {
      throw new ResponseError.Error('Unauthorized access to large catch', ResponseError.status.UNAUTHORIZED)
    }

    // Check they are not messing about with somebody else's activity
    if (!activities.map(a => a._links.self.href).includes(largeCatch._links.activityEntity.href)) {
      throw new ResponseError.Error('Unauthorized access to large catch', ResponseError.status.UNAUTHORIZED)
    }
    largeCatch = await catchesApi.doMap(request, largeCatch)

    // Write the catch id onto the cache
    cache.largeCatch = { id: largeCatch.id }
    await request.cache().set(cache)

    const dateCaught = Moment(largeCatch.dateCaught)
    const payload = {
      river: largeCatch.activity.river.id,
      day: dateCaught.format('DD'),
      month: dateCaught.format('MM'),
      type: largeCatch.species.id,
      pounds: Math.floor(largeCatch.mass.oz / 16),
      ounces: Math.round(largeCatch.mass.oz % 16),
      system: largeCatch.mass.type,
      kilograms: Math.round(largeCatch.mass.kg * 1000) / 1000,
      method: largeCatch.method.id,
      released: largeCatch.released ? 'true' : 'false'
    }

    if (largeCatch.noDateRecorded) {
      payload.noDateRecorded = 'true'
    }

    if (largeCatch.onlyMonthRecorded) {
      payload.onlyMonthRecorded = 'true'
    }

    return this.readCacheAndDisplayView(request, h, {
      rivers: rivers,
      year: cache.year,
      types: await speciesApi.list(request),
      methods: methods,
      payload: payload,
      details: {
        licenceNumber: cache.licenceNumber,
        postcode: cache.postcode,
        year: cache.year
      }
    })
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
      throw new ResponseError.Error('Unknown large catch', ResponseError.status.UNAUTHORIZED)
    }

    const cache = await request.cache().get()
    cache.back = request.path
    const submission = await submissionsApi.getById(request, cache.submissionId)
    const activities = await activitiesApi.getFromLink(request, submission._links.activities.href)

    const rivers = activities.map(a => a.river)
      .filter(r => process.env.CONTEXT === 'FMT' ? true : !r.internal)

    const methods = (await methodsApi.list(request))
      .filter(r => process.env.CONTEXT === 'FMT' ? true : !r.internal)

    // Test if the submission is locked and if so redirect to the review screen
    if (await testLocked(request, cache, submission)) {
      return h.redirect('/review')
    }

    return request.params.id === 'add'
      ? this.add(request, h, cache, rivers, methods)
      : this.change(request, h, cache, rivers, methods, activities)
  }

  /**
   * Post handler for the select salmon and large trout page
   * @param request
   * @param h
   * @param errors
   * @returns {Promise<*>}
   */
  async doPost (request, h, errors) {
    let next
    const cache = await request.cache().get()

    // Clear the submission level exclude flag
    if (!errors) {
      const submission = await submissionsApi.getById(request, cache.submissionId)
      if (submission.reportingExclude) {
        await submissionsApi.changeExclusion(request, submission.id, false)
      }
    }

    // Determine the next page
    if (Object.keys(request.payload).includes('add')) {
      next = '/catches/add'
      cache.add = { river: request.payload.river }
    } else {
      next = '/summary'
      delete cache.add
    }

    return this.writeCacheAndRedirect(request, h, errors, next,
      `/catches/${encodeURIComponent(request.params.id)}`, cache)
  }
}

class SalmonAndLargeTroutHandlerClear extends SalmonAndLargeTroutHandler {
  async doGet (request, h) {
    await this.clearCacheErrorsAndPayload(request)
    return super.doGet(request, h)
  }
}

module.exports = {
  SalmonAndLargeTroutHandler, SalmonAndLargeTroutHandlerClear
}
