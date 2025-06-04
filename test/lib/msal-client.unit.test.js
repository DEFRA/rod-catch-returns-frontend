const mockFetch = jest.fn()
const fetch = require('node-fetch')
const msal = require('@azure/msal-node')

jest.mock('node-fetch', () => mockFetch)
jest.mock('https-proxy-agent', () => ({
  HttpsProxyAgent: jest.fn()
}))

const loadMsalClient = () => {
  jest.resetModules()
  return require('../../src/lib/msal-client')
}

describe('msal-client', () => {
  describe('msalClient', () => {
    const originalEnv = process.env

    beforeEach(() => {
      jest.clearAllMocks()
      process.env = { ...originalEnv }
      jest.spyOn(console, 'log').mockImplementation(() => {})
      jest.spyOn(console, 'error').mockImplementation(() => {})

      mockFetch.mockResolvedValue({
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ access_token: 'fake-token' }),
        status: 200
      })
    })

    afterAll(() => {
      process.env = originalEnv
    })

    it('should initialise msal with the correct config', () => {
      const { msalClient } = loadMsalClient()

      const authConfig = msalClient.config.auth
      expect(authConfig.clientId).toBe('mock-client-id')
      expect(authConfig.clientSecret).toBe('mock-client-secret')
      expect(authConfig.authority).toBe('https://login.microsoftonline.com/mock-tenant-id')
    })

    it('includes loggerOptions in development mode', () => {
      process.env.NODE_ENV = 'development'

      const { msalClient } = loadMsalClient()

      expect(msalClient.config.system.loggerOptions).toBeDefined()
      expect(msalClient.config.system.loggerOptions.logLevel).toBe(msal.LogLevel.Verbose)
    })

    it('sets the body in the request to a string, if it is already string', async () => {
      const { msalClient } = loadMsalClient()

      await msalClient.config.system.networkClient.sendGetRequestAsync(
        'https://api.test',
        { body: '{"test":"test"}' }
      )

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test',
        expect.objectContaining(
          { body: '{"test":"test"}' }
        )
      )
    })

    it('sets the body in the request to a string, if it is json object', async () => {
      const { msalClient } = loadMsalClient()

      await msalClient.config.system.networkClient.sendGetRequestAsync(
        'https://api.test',
        { body: { test: 'test' } }
      )

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test',
        expect.objectContaining(
          { body: '{"test":"test"}' }
        )
      )
    })

    it('sets proxy agent when https_proxy is defined', async () => {
      process.env.https_proxy = 'http://proxy.test'
      const { msalClient } = loadMsalClient()
      const testHeaders = { Authorization: 'Bearer token' }

      const result = await msalClient.config.system.networkClient.sendGetRequestAsync(
        'https://api.test',
        { headers: testHeaders }
      )

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test',
        expect.objectContaining({
          headers: testHeaders,
          method: 'get',
          agent: expect.any(Object)
        })
      )
      expect(result.status).toBe(200)
      expect(result.body).toStrictEqual({ access_token: 'fake-token' })
    })

    it('does not set httpsAgent if https_proxy is not defined', async () => {
      delete process.env.https_proxy
      const { msalClient } = loadMsalClient()
      const testHeaders = { Authorization: 'Bearer token' }

      const result = await msalClient.config.system.networkClient.sendPostRequestAsync(
        'https://api.test',
        { headers: testHeaders, body: { foo: 'bar' } }
      )

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test',
        expect.not.objectContaining({ httpsAgent: expect.anything() })
      )
      expect(result.status).toBe(200)
      expect(result.body).toStrictEqual({ access_token: 'fake-token' })
    })

    it('does not log messages that contain PII', () => {
      process.env.NODE_ENV = 'development'
      const { msalClient } = loadMsalClient()
      const loggerCallback = msalClient.config.system.loggerOptions.loggerCallback

      loggerCallback(msal.LogLevel.Error, 'Sensitive info', true)

      expect(console.error).not.toHaveBeenCalled()
      expect(console.log).not.toHaveBeenCalled()
    })

    it.each([
      [msal.LogLevel.Error, 'An error occurred', 'error'],
      [msal.LogLevel.Warning, 'This is a warning', 'log'],
      [msal.LogLevel.Info, 'Just some info', 'log'],
      [msal.LogLevel.Verbose, 'Verbose output', 'log']
    ])(
      'logs message with appropriate console method for level %s',
      (level, message, expectedMethod) => {
        process.env.NODE_ENV = 'development'
        const { msalClient } = loadMsalClient()
        const loggerCallback = msalClient.config.system.loggerOptions.loggerCallback

        loggerCallback(level, message, false)

        expect(console[expectedMethod]).toHaveBeenCalledWith(message)
      }
    )
  })
})
