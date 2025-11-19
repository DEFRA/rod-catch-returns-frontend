const AgeWeightKeyCancelHandler = require('../../src/handlers/age-weight-key-cancel')
const { getMockH } = require('../test-utils/server-test-utils')

describe('age-weight-key-cancel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should call clearCacheErrorsAndPayload with request', async () => {
      const handler = new AgeWeightKeyCancelHandler('age-weight-key-cancel', null, 'ageWeightContext')
      const mockRequest = {}
      const h = getMockH()
      handler.clearCacheErrorsAndPayload = jest.fn().mockResolvedValue()
      h.redirect = jest.fn().mockReturnValue('redirected')

      await handler.doGet(mockRequest, h)

      expect(handler.clearCacheErrorsAndPayload).toHaveBeenCalledWith(mockRequest)
    })

    it('should redirect to /licence', async () => {
      const handler = new AgeWeightKeyCancelHandler('age-weight-key-cancel', null, 'ageWeightContext')
      const mockRequest = {}
      const h = getMockH()
      handler.clearCacheErrorsAndPayload = jest.fn().mockResolvedValue()
      h.redirect = jest.fn().mockReturnValue('redirected')

      await handler.doGet(mockRequest, h)

      expect(h.redirect).toHaveBeenCalledWith('/licence')
    })

    it('should return the redirect result', async () => {
      const handler = new AgeWeightKeyCancelHandler('age-weight-key-cancel', null, 'ageWeightContext')
      const mockRequest = {}
      const h = getMockH()
      handler.clearCacheErrorsAndPayload = jest.fn().mockResolvedValue()
      h.redirect = jest.fn().mockReturnValue('redirected')

      const result = await handler.doGet(mockRequest, h)

      expect(result).toBe('redirected')
    })
  })
})
