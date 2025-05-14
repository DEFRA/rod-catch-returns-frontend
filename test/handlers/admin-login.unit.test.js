const AdminLoginHandler = require('../../src/handlers/admin-login')

const { msalClient } = require('../../src/lib/msal-client')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/lib/msal-client')

describe('login', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  describe('doGet', () => {
    it('should call getAuthCodeUrl with the correct config', async () => {
      const handler = new AdminLoginHandler()
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

      const handler = new AdminLoginHandler()
      await handler.doGet({}, h)

      expect(h.redirect).toHaveBeenCalledWith('https://mock-auth-url')
    })
  })

  describe('doPost', () => {

  })
})
