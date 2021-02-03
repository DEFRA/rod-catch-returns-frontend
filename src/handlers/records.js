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
   * @param user
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
    return h.view(this.path)
  }
}
