'use strict'

/**
 * Validate the salmon and large trout
 */
const moment = require('moment')
const { getSorterForApiErrors, apiErrors } = require('./common')
const SubmissionsApi = require('../api/submissions')
const ActivitiesApi = require('../api/activities')
const CatchesApi = require('../api/catches')

const catchesApi = new CatchesApi()
const submissionsApi = new SubmissionsApi()
const activitiesApi = new ActivitiesApi()

/*
 * Function to parse the date entered to ensure it is well either well formed or null so that it
 * can be passed to the API. Returns a date string in the required format or null.
 */
function cleanDate (payload, cache) {
  if (!payload.month || !payload.day) {
    return null
  } else if (Number.isNaN(Number.parseInt(payload.month)) || Number.isNaN(Number.parseInt(payload.day))) {
    return null
  } else {
    const dateCaught = moment({ year: cache.year, month: payload.month - 1, day: payload.day })
    return dateCaught.isValid()
      ? moment({ year: cache.year, month: payload.month - 1, day: payload.day }).format() : null
  }
}

function conversion (payload, errors) {
  if (payload.system === 'METRIC' && errors.filter(e => e['kilograms']).length === 0) {
    const oz = 35.27396195 * Number.parseFloat(payload.kilograms)
    payload.pounds = Math.floor(oz / 16)
    payload.ounces = Math.round(oz % 16)
  } else if (payload.system === 'IMPERIAL' && errors.filter(e => e['pounds']).length === 0 && errors.filter(e => e['ounces']).length === 0) {
    const oz = (16 * Number.parseInt(payload.pounds)) + Number.parseInt(payload.ounces)
    payload.kilograms = Math.round(0.0283495 * oz * 1000) / 1000
  }
}

module.exports = async (request) => {
  const payload = request.payload
  const errors = []
  const cache = await request.cache().get()

  // Validate the date
  const dateCaught = cleanDate(payload, cache)

  // Do the conversion
  conversion(payload, errors)

  const submission = await submissionsApi.getById(request, cache.submissionId)
  const activities = await activitiesApi.getFromLink(request, submission._links.activities.href)

  const mass = {
    kg: Number.parseFloat(payload.kilograms),
    oz: (16 * Number.parseInt(payload.pounds)) + Number.parseInt(payload.ounces),
    type: payload.system
  }

  // Get the activity from the river id
  const activityId = (() => {
    const activity = activities.find(a => a.river.id === payload.river)
    return activity ? activity.id : null
  })()

  const released = (() => {
    if (payload.released === 'true') {
      return true
    } else if (payload.released === 'false') {
      return false
    } else {
      return null
    }
  })(errors)

  // Test if we are adding or updating
  let result
  if (cache.largeCatch) {
    result = await catchesApi.change(request,
      cache.largeCatch.id,
      activityId,
      dateCaught,
      payload.type,
      mass,
      payload.method,
      released,
      Object.keys(payload).includes('onlyMonthRecorded'),
      Object.keys(payload).includes('noDateRecorded')
    )
  } else {
    result = await catchesApi.add(request,
      cache.submissionId,
      activityId,
      dateCaught,
      payload.type,
      mass,
      payload.method,
      released,
      Object.keys(payload).includes('onlyMonthRecorded'),
      Object.keys(payload).includes('noDateRecorded')
    )
  }

  const sorter = getSorterForApiErrors('Catch',
    'ACTIVITY',
    'DATE',
    'CATCH_SPECIES_REQUIRED',
    'CATCH_MASS_TYPE_REQUIRED',
    'MASS',
    'CATCH_METHOD_REQUIRED',
    'CATCH_RELEASED_REQUIRED')

  if (Object.keys(result).includes('errors')) {
    return errors.concat(apiErrors(result).sort(sorter))
  } else {
    return errors.length ? errors : null
  }
}
