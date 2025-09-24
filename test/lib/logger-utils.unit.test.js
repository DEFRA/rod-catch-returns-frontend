const { logRequest, logResponse } = require('../../src/lib/logger-utils')
const { getMockH } = require('../test-utils/server-test-utils')
const { logger } = require('defra-logging-facade')

jest.mock('defra-logging-facade')

describe('logger-utils.unit', () => {
  describe('logRequest', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    const getMockRequest = (overrides = {}) => ({
      method: 'get',
      path: '/test',
      ...overrides
    })

    it('should log the request', () => {
      logRequest(getMockRequest(), getMockH())

      expect(logger.info).toHaveBeenCalledWith('GET /test')
    })

    it('should log the request if it contains a body', () => {
      const request = getMockRequest({
        method: 'post',
        payload: {
          a: 'b'
        }
      })
      logRequest(request, getMockH())

      expect(logger.info).toHaveBeenCalledWith('POST /test - {"a":"b"}')
    })

    it('should return h.continue', () => {
      const h = getMockH()
      const result = logRequest(getMockRequest(), h)

      expect(result).toBe(h.continue)
    })

    it.each([
      '/public/govuk-frontend.min.js',
      '/public/',
      '/robots.txt'
    ])('should not log if path includes %s', (path) => {
      const request = getMockRequest({
        path
      })

      logRequest(request, getMockH())

      expect(logger.info).not.toHaveBeenCalled()
    })
  })

  describe('logResponse', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    const getMockRequest = (overrides = {}) => ({
      method: 'get',
      path: '/test',
      response: {
        statusCode: 200
      },
      ...overrides
    })

    it('should log the response', () => {
      logResponse(getMockRequest(), getMockH())

      expect(logger.info).toHaveBeenCalledWith('GET /test -> 200')
    })

    it('should return h.continue', () => {
      const h = getMockH()
      const result = logResponse(getMockRequest(), h)

      expect(result).toBe(h.continue)
    })

    it.each([
      '/public/govuk-frontend.min.js',
      '/public/',
      '/robots.txt'
    ])('should not log if path includes %s', (path) => {
      const request = getMockRequest({
        path
      })

      logResponse(request, getMockH())

      expect(logger.info).not.toHaveBeenCalled()
    })
  })
})
