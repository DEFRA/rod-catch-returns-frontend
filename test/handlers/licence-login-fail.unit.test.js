const LicenceAuthNotFoundHandler = require('../../src/handlers/licence-login-fail')
const { getMockH } = require('../test-utils/server-test-utils')

describe('licence-auth-not-found-handler.unit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('doGet', () => {
    it('should render the licence view with NOT_FOUND error', async () => {
      const request = {}
      const h = getMockH()
      const handler = new LicenceAuthNotFoundHandler('licence')

      await handler.doGet(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'licence',
        { errors: { licence: 'NOT_FOUND' } }
      )
    })
  })
})
