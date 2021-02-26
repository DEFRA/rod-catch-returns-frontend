'use strict'

const Client = require('./client')

/**
 * Licence handler - note licence is not an entity in the API model
 * is has a specific endpoint so it does not derive from EntityApi
 */
module.exports = class LicenceApi {
  /**
   * Gets the contact data from the last 6 digits of the licence number
   * @returns {Promise<*>}
   */
  static async getContactFromLicenceKey (request, licence, postcode) {
    return Client.request(null, Client.method.GET, `licence/${licence}`, `verification=${postcode}`, null, true)
  }

  /**
   * Gets the contact data from the full licence number
   * @returns {Promise<*>}
   */
  static async getContactFromFullLicenceNumber (request, licence) {
    return Client.request(null, Client.method.GET, `licence/full/${licence}`, null, null, true)
  }
}
