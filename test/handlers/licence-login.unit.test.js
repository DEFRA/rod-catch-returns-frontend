const LicenceAuthHandler = require('../../src/handlers/licence-login')
const { getMockH } = require('../test-utils/server-test-utils')

const mockAuthenticateUser = jest.fn()

jest.mock('../../src/lib/authenticate-user', () => {
  return jest.fn((...args) => mockAuthenticateUser(...args))
})

describe('licence-auth-handler.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should render the licence view', async () => {
      const request = {}
      const h = getMockH()
      const handler = new LicenceAuthHandler('licence-auth')

      await handler.doGet(request, h)

      expect(h.view).toHaveBeenCalledWith('licence-auth')
    })
  })

  describe('doPost', () => {
    it('should redirect to /licence-auth-fail and not call authenticateUser when there are errors', async () => {
      const request = {}
      const h = getMockH()
      const handler = new LicenceAuthHandler('licence-auth')
      const errors = [{ field: 'licence', message: 'invalid' }]

      await handler.doPost(request, h, errors)

      expect(mockAuthenticateUser).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith('/licence-auth-fail')
    })

    it('should authenticate user and redirect to /select-year when no errors', async () => {
      const request = {}
      const h = getMockH()
      const handler = new LicenceAuthHandler('licence-auth')
      mockAuthenticateUser.mockResolvedValueOnce()

      await handler.doPost(request, h, null)

      expect(mockAuthenticateUser).toHaveBeenCalledWith(request)
      expect(h.redirect).toHaveBeenCalledWith('/select-year')
    })
  })
})
