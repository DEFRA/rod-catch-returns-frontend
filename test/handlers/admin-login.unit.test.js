const AdminLoginHandler = require('../../src/handlers/admin-login')
const { msalClient } = require('../../src/lib/msal-client')
const { getMockH } = require('../test-utils/server-test-utils')
const Boom = require('@hapi/boom')
const Client = require('../../src/api/client')
const authenticateUser = require('../../src/lib/authenticate-user')
const { calculateTokenTtl } = require('../../src/lib/date-utils')
const { logger } = require('defra-logging-facade')

jest.mock('../../src/lib/msal-client')
jest.mock('@hapi/boom')
jest.mock('../../src/api/client')
jest.mock('../../src/lib/authenticate-user')
jest.mock('../../src/lib/date-utils')
jest.mock('defra-logging-facade')

const handler = new AdminLoginHandler()

describe('login', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  describe('doGet', () => {
    it('should call getAuthCodeUrl with the correct config', async () => {
      await handler.doGet({}, getMockH())

      expect(msalClient.getAuthCodeUrl).toHaveBeenCalledWith({
        scopes: ['mock-client-id/.default'],
        redirectUri: 'http://localhost/mock-redirect',
        responseMode: 'form_post'
      })
    })

    it('should redirect to the auth url', async () => {
      const h = getMockH()
      msalClient.getAuthCodeUrl.mockResolvedValue('https://mock-auth-url')

      await handler.doGet({}, h)

      expect(h.redirect).toHaveBeenCalledWith('https://mock-auth-url')
    })
  })

  describe('doPost', () => {
    const getMockRequest = (code) => ({
      payload: {
        code
      }
    })

    const getAcquireTokenByCodeResponse = (overrides = {}) => ({
      accessToken: 'token', account: { name: 'Bob Jones' }, expiresOn: '2025-06-19T10:31:55.000Z', ...overrides
    })

    it('should return an error if code is missing from the body', async () => {
      await handler.doPost({ payload: {} }, getMockH())

      expect(logger.error).toHaveBeenCalledWith('Auth error:', new Error('No authorization code provided'))
      expect(Boom.unauthorized).toHaveBeenCalledWith('Authentication failed')
    })

    it('should call acquireTokenByCode with the correct parameters', async () => {
      const code = 'abc123'
      await handler.doPost(getMockRequest(code), getMockH())

      expect(msalClient.acquireTokenByCode).toHaveBeenCalledWith({
        code,
        scopes: [],
        redirectUri: 'http://localhost/mock-redirect'
      })
    })

    it('should return an error if accessToken is not returned from Microsoft', async () => {
      msalClient.acquireTokenByCode.mockResolvedValueOnce({})

      await handler.doPost(getMockRequest('abc123'), getMockH())

      expect(logger.error).toHaveBeenCalledWith('Auth error:', new Error('No access token in response from Microsoft'))
      expect(Boom.unauthorized).toHaveBeenCalledWith('Authentication failed')
    })

    it('should call /profile with the access token from Microsoft', async () => {
      const accessToken = 'aaaabbbbcccc'
      msalClient.acquireTokenByCode.mockResolvedValueOnce(getAcquireTokenByCodeResponse({ accessToken }))
      await handler.doPost(getMockRequest('abc123'), getMockH())

      expect(Client.request).toHaveBeenCalledWith(
        accessToken,
        'GET',
        'profile'
      )
    })

    it('should set the name, token and ttl on request.app', async () => {
      msalClient.acquireTokenByCode.mockResolvedValueOnce(getAcquireTokenByCodeResponse())
      calculateTokenTtl.mockReturnValueOnce(6000)
      const mockRequest = getMockRequest('abc123')
      await handler.doPost(mockRequest, getMockH())

      expect(mockRequest.app.authorization).toStrictEqual(
        {
          name: 'Bob Jones',
          token: 'token',
          ttlMs: 6000
        }
      )
    })

    it('should call authenticateUser to setup the session', async () => {
      msalClient.acquireTokenByCode.mockResolvedValueOnce(getAcquireTokenByCodeResponse())
      const mockRequest = getMockRequest('abc123')
      await handler.doPost(mockRequest, getMockH())

      expect(authenticateUser).toHaveBeenCalledWith(mockRequest)
    })

    it('should redirect to the homepage', async () => {
      const h = getMockH()
      msalClient.acquireTokenByCode.mockResolvedValueOnce(getAcquireTokenByCodeResponse())
      await handler.doPost(getMockRequest('abc123'), h)

      expect(h.redirect).toHaveBeenCalledWith('/')
    })

    it('should redirect to /oidc/account-disabled if /profile returns ACCOUNT_DISABLED error', async () => {
      const h = getMockH()
      msalClient.acquireTokenByCode.mockResolvedValue(getAcquireTokenByCodeResponse())
      Client.request.mockRejectedValue({ body: { error: 'ACCOUNT_DISABLED' } })

      await handler.doPost(getMockRequest('code'), h)

      expect(h.redirect).toHaveBeenCalledWith('/oidc/account-disabled')
    })

    it('should redirect to /oidc/account-role-required if /profile returns ACCOUNT_ROLE_REQUIRED error', async () => {
      const h = getMockH()
      msalClient.acquireTokenByCode.mockResolvedValue(getAcquireTokenByCodeResponse())
      Client.request.mockRejectedValue({ body: { error: 'ACCOUNT_ROLE_REQUIRED' } })

      await handler.doPost(getMockRequest('code'), h)

      expect(h.redirect).toHaveBeenCalledWith('/oidc/account-role-required')
    })

    it('should return an error if there is a problem when calling /profile', async () => {
      const mockError = new Error('Error fetching client')
      msalClient.acquireTokenByCode.mockResolvedValue(getAcquireTokenByCodeResponse())
      Client.request.mockRejectedValue(mockError)

      await handler.doPost(getMockRequest('abc123'), getMockH())

      expect(logger.error).toHaveBeenCalledWith('Auth error:', mockError)
      expect(Boom.unauthorized).toHaveBeenCalledWith('Authentication failed')
    })
  })
})
