'use strict'

/**
 * Validate the small catch
 */
const SubmissionsApi = require('../api/submissions')
const ActivitiesApi = require('../api/activities')
const SmallCatchesApi = require('../api/small-catches')
const MethodsApi = require('../api/methods')
const { isInt, subNumber, apiErrors, getSorterForApiErrors } = require('./common')
const submissionsApi = new SubmissionsApi()
const activitiesApi = new ActivitiesApi()
const smallCatchesApi = new SmallCatchesApi()
const methodsApi = new MethodsApi()

/**
 * recombines what was sent to the API with the result returned from the API
 * @param errors
 * @param apiCounts
 * @param apiIgnore
 * @param methods
 * @returns {*}
 */
const apiMethodErrorRemapper = (errors, apiCounts, apiIgnore, methods) => {
  const propCount = /counts\[([0-4])\]\.count/
  return errors
    // Filter out results we want to ignore because we will use a front end generated error
    .filter(e => {
      const search = propCount.exec(e.property)
      if (!search || !apiIgnore.length) {
        return true
      } else {
        // Locate the position in the API ignore array
        return !apiIgnore.includes(Number.parseInt(search[1]))
      }
    })
    .map(e => {
      const search = propCount.exec(e.property)
      if (!search) {
        return e
      } else {
        // Locate the position in the API array
        const apiReqItem = apiCounts[Number.parseInt(search[1])]
        // Find method
        const method = methods.find(m => m.id === apiReqItem.method)
        // Manipulate message
        e.SmallCatch = e.SmallCatch.replace('_COUNTS_', '_' + method.name.toUpperCase() + '_COUNT_')
        return e
      }
    })
}

module.exports = async (request) => {
  const payload = request.payload
  const errors = []
  const cache = await request.cache().get()
  let monthForApi

  if (!payload.month.trim()) {
    monthForApi = null
  } else if (isNaN(payload.month)) {
    monthForApi = null
  } else if (Number.parseInt(payload.month) < 1 || Number.parseInt(payload.month) > 12) {
    monthForApi = null
  } else {
    monthForApi = Number.parseInt(payload.month)
  }

  /*
   * Check methods - allow blanks in the input which will be translated to zero's for display purposes
   * but don't create entries in the counts array where the number is not set
   * because the API will not accept them. Otherwise we assign to counts and allow the API to perform validation
   */
  const methods = await methodsApi.list(request)
  const apiCounts = []
  const apiIgnore = []

  methods.forEach(m => {
    const name = m.name.toLowerCase()
    if (Object.keys(payload).includes(name)) {
      const count = payload[name]
      if (count.trim()) {
        if (isInt(count)) {
          if (Number.parseInt(count) !== 0) {
            apiCounts.push({
              method: m.id,
              count: count
            })
          }
        } else {
          /*
           * We have to send something that will fail the validation otherwise we might erroneously save the data.
           * ignore the api error here and replace with a front end generated one
           */
          apiCounts.push({
            method: m.id,
            count: null
          })

          // Push the array index of the count payload to ignore
          apiIgnore.push(apiCounts.length - 1)

          errors.push({ SmallCatch: 'SMALL_CATCH_' + m.name.toUpperCase() + '_COUNT_INVALID' })
        }
      }
    }
  })

  const submission = await submissionsApi.getById(request, cache.submissionId)
  const activities = await activitiesApi.getFromLink(request, submission._links.activities.href)

  // Get the activity from the river id
  const activityId = (() => {
    const activity = activities.find(a => a.river.id === payload.river)
    return activity ? activity.id : null
  })()

  /*
   * Add or change the result in the API merging any validation errors
   */
  let result
  if (cache.smallCatch) {
    result = await smallCatchesApi.change(request,
      cache.smallCatch.id,
      activityId,
      monthForApi,
      apiCounts,
      subNumber(payload.released),
      Object.keys(payload).includes('noMonthRecorded')
    )
  } else {
    result = await smallCatchesApi.add(request,
      cache.submissionId,
      activityId,
      monthForApi,
      apiCounts,
      subNumber(payload.released),
      Object.keys(payload).includes('noMonthRecorded')
    )
  }

  const sorter = getSorterForApiErrors('SmallCatch',
    'ACTIVITY',
    'MONTH',
    'COUNTS',
    'FLY',
    'SPINNER',
    'BAIT',
    'UNKNOWN',
    'RELEASED')

  if (Object.keys(result).includes('errors')) {
    const reMappedApiErrors = apiMethodErrorRemapper(apiErrors(result),
      apiCounts, apiIgnore, methods)

    return errors.concat(reMappedApiErrors).sort(sorter)
  } else {
    return errors.length ? errors : null
  }
}
