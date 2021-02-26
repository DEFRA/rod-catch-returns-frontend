'use strict'

/**
 * Display the Records page
 */
const BaseHandler = require('./base')
const LicenceApi = require('../api/licence')
const SubmissionsApi = require('../api/submissions')

const submissionsApi = new SubmissionsApi()

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
  async doPost (request, h) {
    const licenceNumber = request.payload.licenceNumber
    const licence = await LicenceApi.getContactFromFullLicenceNumber(request, licenceNumber)
    return h.redirect(`/records-search-results?contactId=${licence.contact.id}`)
  }
}
