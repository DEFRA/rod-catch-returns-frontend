'use strict'
const { logger } = require('defra-logging-facade')
const Fs = require('fs')
const moment = require('moment')
/**
 * Display the age weight key upload page
 */
const BaseHandler = require('./base')
const GatesApi = require('../api/gates')

const gatesApi = new GatesApi()

module.exports = class AgeWeightKeyHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  removeTempFile (request) {
    if (request.payload.upload) {
      Fs.unlinkSync(request.payload.upload.path)
      logger.debug(`Removed temporary file: ${request.payload.upload.path}`)
    }
  }

  /**
   * Get handler for age weight key upload
   * @param request
   * @param h
   * @param user
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    const cache = await request.cache().get()
    const gate = cache[this.context] && cache[this.context].payload && cache[this.context].payload.gate ? cache[this.context].payload.gate : ''
    const year = cache[this.context] && cache[this.context].payload && cache[this.context].payload.year ? cache[this.context].payload.year : ''

    const gates = (await gatesApi.list(request)).map(e => {
      return {
        id: e.id,
        name: e.name
      }
    })

    const now = moment()
    const years = [-2, 2].map(y => (now.year() + y).toString())

    return this.readCacheAndDisplayView(request, h, { gate, year, gates, years })
  }

  async doPost (request, h, errors) {
    const cache = await request.cache().get()
    const gate = (await gatesApi.list(request)).filter(e => e.id === request.payload.gate)[0]

    cache.ageWeightKey = {
      filename: request.payload.upload ? request.payload.upload.filename : '',
      year: request.payload.year,
      gate: gate ? gate.name : ''
    }

    cache[this.context] = cache[this.context] || {}
    cache[this.context].payload = request.payload
    await request.cache().set(cache)

    if (cache[this.context].ageWeightKeyConflict) {
      return h.redirect('/age-weight-key-conflict-check')
    } else {
      this.removeTempFile(request)
      return this.writeCacheAndRedirect(request, h, errors, '/age-weight-key-ok', '/age-weight-key')
    }
  }
}
