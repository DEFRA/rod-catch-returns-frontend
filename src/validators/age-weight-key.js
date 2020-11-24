'use strict'

const { logger } = require('defra-logging-facade')
const moment = require('moment')

const AgeWeightKeyApi = require('../api/age-weight-key')
const ResponseError = require('../handlers/response-error')

const Path = require('path')
const NodeClam = require('clamscan')
const Fs = require('fs')

const MAX_FILE_UPLOAD_BYTES = process.env.MAX_FILE_UPLOAD_BYTES || 100 * 1000 // 100Kb

function FileScanner (filename, path) {
  this.filename = filename
  this.path = path
}

(async () => {
  try {
    if (process.env.CLAMD_SOCK && process.env.CLAMD_PORT) {
      FileScanner.prototype.scanner = await new NodeClam().init({
        clamdscan: {
          socket: process.env.CLAMD_SOCK,
          port: process.env.CLAMD_PORT,
          local_fallback: false
        },
        preference: 'clamdscan'
      })
      const version = await FileScanner.prototype.scanner.get_version()
      logger.info(`Found virus scanner: ${version} - running using sockets`)
    } else {
      FileScanner.prototype.scanner = await new NodeClam().init({
        preference: 'clamscan'
      })
      logger.info('Found virus scanner: - running using local binary')
    }
  } catch (err) {
    logger.error(`No virus scanner found; ${this.filename} will not be virus checked`)
  }
})()

FileScanner.prototype.scan = async function (vmock) {
  try {
    // Ensure that the clamd user can read, write and execute the file
    logger.info(`Scanning ${this.filename} for viruses...`)
    Fs.chmod(this.path, 0o777, (err) => {
      if (err) throw err
    })

    return this.scanner
      ? this.scanner.is_infected(this.path)
      : {
          is_infected: !!vmock,
          file: this.filename,
          viruses: []
        }
  } catch (err) {
    logger.error(err)
  }
}

function preValidate (request, errors) {
  const years = [-2, -1, 0, 1, 2].map(y => (moment().year() + y).toString())

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
}

/**
 * Validate the did you fish input
 */
module.exports = async (request) => {
  const errors = []
  preValidate(request, errors)

  /**
   * Upload the file and then retrieve tha API errors
   */
  if (!errors.length) {
    const tempFilePath = request.payload.upload.path
    logger.debug(`Uploaded age weight key file: ${tempFilePath}`)

    const fileScanner = new FileScanner(request.payload.upload.filename, tempFilePath)
    const { is_infected: isInfected } = await fileScanner.scan(request.payload.vmock)

    // console.log({ isInfected, file, viruses })
    if (isInfected) {
      return [{ type: 'FILE_HAS_VIRUS' }]
    }

    const response = await AgeWeightKeyApi.postNew(request, request.payload.year,
      request.payload.gate, tempFilePath, !!request.payload.overwrite)

    if (response.statusCode === ResponseError.status.CONFLICT) {
      return [{ type: 'OVERWRITE_DISALLOWED' }]
    }

    if (response.status === ResponseError.status.BAD_REQUEST && response.errors) {
      return [{ type: 'BAD_FILE' }].concat(response.errors)
    }
  }

  return errors.length ? errors : null
}
