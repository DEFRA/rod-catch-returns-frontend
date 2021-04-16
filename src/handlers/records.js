'use strict'

/**
 * Display the Records page
 */
const BaseHandler = require('./base')

module.exports = class RecordsHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for records
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  async doGet (request, h) {
    return h.view(this.path)
  }

  /**
   * Post handler for records
   * @param request
   * @param h
   * @param errors
   * @returns {Promise<*>}
   */
  async doPost (request, h, errors) {
    if (errors) {
      return h.view(this.path, { errors: { errors }, payload: request.payload })
    }
    const cache = await request.cache().get()
    cache.recordsContactId = request.payload.licence.contact.id
    cache.fullName = request.payload.licence.contact.fullName
    await request.cache().set(cache)

    return h.redirect('/records-search-results')
  }
}
