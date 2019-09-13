'use strict'

/**
 * Validate the river and the number of days fished
 */
const apiErrors = require('./common').apiErrors
const subNumber = require('./common').subNumber
const checkNumber = require('./common').checkNumber

const ActivitiesApi = require('../api/activities')
const activitiesApi = new ActivitiesApi()

module.exports = async (request) => {
  const payload = request.payload

  const errors = []

  payload.daysFishedOther = checkNumber('daysFishedOther', payload.daysFishedOther, errors)
  payload.daysFishedWithMandatoryRelease = checkNumber('daysFishedWithMandatoryRelease', payload.daysFishedWithMandatoryRelease, errors)

  // if there are no errors try to persist the activity
  const cache = await request.cache().get()
  let result

  // Test if we are adding or updating
  if (cache.activity) {
    result = await activitiesApi.change(request, cache.activity.id, cache.submissionId, payload.river,
      subNumber(payload.daysFishedWithMandatoryRelease), subNumber(payload.daysFishedOther))
  } else {
    result = await activitiesApi.add(request, cache.submissionId, payload.river,
      subNumber(payload.daysFishedWithMandatoryRelease), subNumber(payload.daysFishedOther))
  }

  if (Object.keys(result).includes('errors')) {
    return errors.concat(apiErrors(result))
  } else {
    return errors.length ? errors : null
  }
}
