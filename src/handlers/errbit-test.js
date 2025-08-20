'use strict'

const BaseHandler = require('./base')
const { logger } = require('defra-logging-facade')

module.exports = class LoginHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * @param {import('@hapi/hapi').Request request - The Hapi request object
   *    @param {string} request.headers.key - The api key required to test the integration
   * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
   * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response that is empty
   */
  async doGet (request, h) {
    logger.info('Testing errbit integration')
    if (!process.env.ERRBIT_TEST_KEY) {
      logger.info('ERRBIT_TEST_KEY has not been set')
      return h.response('').code(500)
    }
    if (request.headers.key === process.env.ERRBIT_TEST_KEY) {
      logger.info('Correct API KEY')
      logger.serverError('Test errbit integration')
    }
    return h.response('').code(200)
  }
}
