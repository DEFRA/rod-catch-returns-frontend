const AgeWeightKeyConflictCheckHandler = require('../../src/handlers/age-weight-key-conflict-check')
const { getMockH } = require('../test-utils/server-test-utils')

describe('age-weight-key-conflict-check', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should return gate and year in the view', async () => {
      const handler = new AgeWeightKeyConflictCheckHandler('age-weight-key-conflict-check', null, 'ageWeightContext')
      const mockRequest = {}
      const h = getMockH()
      handler.getCacheContext = jest.fn().mockResolvedValue({
        ageWeightKey: {
          gateName: 'Test Gate',
          year: 2025
        }
      })
      handler.readCacheAndDisplayView = jest.fn().mockResolvedValue('mock-view-response')

      await handler.doGet(mockRequest, h)

      expect(handler.readCacheAndDisplayView).toHaveBeenCalledWith(
        mockRequest,
        h,
        { gate: 'Test Gate', year: 2025 }
      )
    })
  })
})
