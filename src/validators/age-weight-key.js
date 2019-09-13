'use strict'

const { logger } = require('defra-logging-facade')
const moment = require('moment')

const AgeWeightKeyApi = require('../api/age-weight-key')
const ResponseError = require('../handlers/response-error')
const Path = require('path')

const MAX_FILE_UPLOAD_BYTES = process.env.MAX_FILE_UPLOAD_BYTES || 100 * 1000 // 100Kb

/**
 * Validate the did you fish input
 */
module.exports = async (request) => {
  const errors = []

  const now = moment()
  const years = [-2, -1, 0, 1, 2].map(y => (now.year() + y).toString())

  if (!request.payload.gate) {
    errors.push({ type: 'NO_GATE_SELECTED' })
  }

  if (!request.payload.year) {
    errors.push({ type: 'NO_YEAR_ENTERED' })
  } else if (!parseInt(request.payload.year)) {
    errors.push({ type: 'NOT_A_REAL_YEAR' })
  } else if (!years.includes(request.payload.year)) {
    errors.push({ type: 'YEAR_OUT_OF_RANGE' })
  }

  if (!request.payload.upload || !request.payload.upload.filename) {
    errors.push({ type: 'NO_FILE_SELECTED' })
  } else {
    if (Path.extname(request.payload.upload.filename.toString().toUpperCase()) !== '.CSV') {
      errors.push({ type: 'BAD_FILE_TYPE' })
    } else {
      if (request.payload.upload.bytes > MAX_FILE_UPLOAD_BYTES) {
        errors.push({ type: 'FILE_TOO_LARGE' })
      } else if (request.payload.upload.bytes === 0) {
        errors.push({ type: 'FILE_EMPTY' })
      }
    }
  }

  if (!errors.length) {
    const tempFilePath = request.payload.upload.path
    logger.debug(`Uploaded age weight key file to: ${tempFilePath}`)
    const response = await AgeWeightKeyApi.postNew(request, request.payload.year, request.payload.gate, tempFilePath, !!request.payload.overwrite)
    // TODO - status code inconsistent from API - needs to be fixed
    if (response) {
      response.status = response.status ? response.status : response.statusCode

      switch (response.status) {
        case ResponseError.status.BAD_REQUEST:
          const cache = await request.cache().get()

          if (Object.keys(response.statusMessage).length === 1 &&
              Object.keys(response.statusMessage)[0] === 'generalErrors' &&
              response.statusMessage.generalErrors[0] === 'OVERWRITE_DISALLOWED') {
            cache.ageWeightContext = cache.ageWeightContext || {}
            cache.ageWeightContext.ageWeightKeyConflict = true
          } else {
            if (cache.ageWeightContext && cache.ageWeightContext.ageWeightKeyConflict) delete cache.ageWeightContext.ageWeightKeyConflict
            errors.push({ type: 'BAD_FILE', message: response.statusMessage })
          }

          await request.cache().set(cache)
          break

        case ResponseError.status.CREATED:
          break

        default:
      }
    }
  }

  return errors.length ? errors : null
}
