const mockInfo = jest.fn()
const mockError = jest.fn()
const mockDebug = jest.fn()
const mockEnable = jest.fn()

jest.mock('debug', () => {
  const mockCreateDebug = jest.fn((namespace) => {
    switch (namespace) {
      case 'rcr-frontend:info':
        return mockInfo
      case 'rcr-frontend:error':
        return mockError
      case 'rcr-frontend:debug':
        return mockDebug
      default:
        return jest.fn()
    }
  })
  mockCreateDebug.inspectOpts = {}
  mockCreateDebug.enable = mockEnable

  return mockCreateDebug
})

const { logRequest, logResponse } = require('../../src/lib/logger-utils')
const { getMockH } = require('../test-utils/server-test-utils')

describe('logger-utils.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  describe('default', () => {
    it('should call createDebug.enable() with correct defaults if DEBUG is not set', () => {
      delete process.env.DEBUG

      // re-import the module (forces top-level execution again)
      require('../../src/lib/logger-utils')

      expect(mockEnable).toHaveBeenCalledWith('rcr-frontend:error,rcr-frontend:info')
    })

    it('should not call createDebug.enable() if DEBUG is already set', () => {
      process.env.DEBUG = 'some:value'

      require('../../src/lib/logger-utils')

      expect(mockEnable).not.toHaveBeenCalled()
    })

    it('should bind info.log to console.log', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

      const { info } = require('../../src/lib/logger-utils')

      info.log('hello world')

      expect(mockConsoleLog).toHaveBeenCalledWith('hello world')
      mockConsoleLog.mockRestore()
    })

    it('should bind debug.log to console.log', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

      const { debug } = require('../../src/lib/logger-utils')

      debug.log('hello world')

      expect(mockConsoleLog).toHaveBeenCalledWith('hello world')
      mockConsoleLog.mockRestore()
    })
  })

  describe('logRequest', () => {
    const getMockRequest = (overrides = {}) => ({
      method: 'get',
      path: '/test',
      ...overrides
    })

    it('should log the request', () => {
      logRequest(getMockRequest(), getMockH())

      expect(mockInfo).toHaveBeenCalledWith('GET /test')
    })

    it('should log the request if it contains a body', () => {
      const request = getMockRequest({
        method: 'post',
        payload: {
          a: 'b'
        }
      })
      logRequest(request, getMockH())

      expect(mockInfo).toHaveBeenCalledWith('POST /test - {"a":"b"}')
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

      expect(mockInfo).not.toHaveBeenCalled()
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

      expect(mockInfo).toHaveBeenCalledWith('GET /test -> 200')
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

      expect(mockInfo).not.toHaveBeenCalled()
    })
  })
})
