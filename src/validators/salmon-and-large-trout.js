'use strict'

/**
 * Validate the salmon and large trout
 */
const moment = require('moment')
const apiErrors = require('./common').apiErrors
const checkNumber = require('./common').checkNumber
const SubmissionsApi = require('../api/submissions')
const ActivitiesApi = require('../api/activities')
const CatchesApi = require('../api/catches')

const { logger } = require('defra-logging-facade')

const catchesApi = new CatchesApi()
const submissionsApi = new SubmissionsApi()
const activitiesApi = new ActivitiesApi()

function validateDate (payload, errors, cache) {
  if (!payload.month || !payload.day) {
    errors.push({ date: 'EMPTY' })
  } else if (Number.isNaN(Number.parseInt(payload.month)) || Number.isNaN(Number.parseInt(payload.day))) {
    errors.push({ date: 'INVALID' })
    payload.day = payload.month = null
  } else {
    const dateCaught = moment({ year: cache.year, month: payload.month - 1, day: payload.day })
    if (!dateCaught.isValid()) {
      errors.push({ date: 'INVALID' })
      payload.day = payload.month = null
    }
  }
}

function validateWeight (payload, errors) {
  if (!payload.system) {
    errors.push({ system: 'EMPTY' })
  } else if (payload.system === 'IMPERIAL') {
    payload.pounds = checkNumber('pounds', payload.pounds, errors)
    payload.ounces = checkNumber('ounces', payload.ounces, errors)
  } else if (payload.system === 'METRIC') {
    payload.kilograms = checkNumber('kilograms', payload.kilograms, errors)
  }
}

function conversion (payload, errors) {
  if (payload.system === 'METRIC' && errors.filter(e => e['kilograms']).length === 0) {
    const oz = 35.274 * Number.parseFloat(payload.kilograms)
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

  logger.debug('Validate salmon and large trout: ' + JSON.stringify(payload))

  // Validate that the river has been selected
  if (!payload.river) {
    errors.push({ river: 'EMPTY' })
  }

  // Validate the date
  validateDate(payload, errors, cache)

  if (!payload.type) {
    errors.push({ type: 'EMPTY' })
  }

  // Validate the weight
  validateWeight(payload, errors)

  if (!payload.method) {
    errors.push({ method: 'EMPTY' })
  }

  if (!payload.released) {
    errors.push({ released: 'EMPTY' })
  }

  // Do the conversion
  conversion(payload, errors)

  if (!errors.length) {
    const submission = await submissionsApi.getById(request, cache.submissionId)
    const activities = await activitiesApi.getFromLink(request, submission._links.activities.href)
    const dateCaught = moment({ year: cache.year, month: payload.month - 1, day: payload.day })

    const mass = {
      kg: Number.parseFloat(payload.kilograms),
      oz: (16 * Number.parseInt(payload.pounds)) + Number.parseInt(payload.ounces),
      type: payload.system
    }

    let result

    // Test if we are adding or updating
    if (cache.largeCatch) {
      result = await catchesApi.change(request,
        cache.largeCatch.id,
        activities.find(a => a.river.id === payload.river).id,
        dateCaught.format(),
        payload.type,
        mass,
        payload.method,
        payload.released === 'true'
      )
    } else {
      result = await catchesApi.add(request,
        cache.submissionId,
        activities.find(a => a.river.id === payload.river).id,
        dateCaught.format(),
        payload.type,
        mass,
        payload.method,
        payload.released === 'true'
      )
    }

    if (Object.keys(result).includes('errors')) {
      return apiErrors(result)
    } else {
      return null
    }
  } else {
    return errors
  }
}
