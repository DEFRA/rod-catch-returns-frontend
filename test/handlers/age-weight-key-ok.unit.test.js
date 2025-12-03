const moment = require('moment')
const BaseHandler = require('../../src/handlers/base')
const AgeWeightKeyOkHandler = require('../../src/handlers/age-weight-key-ok')
const { getMockH } = require('../test-utils/server-test-utils')

describe('age-weight-key-ok.unit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('AgeWeightKeyOkHandler', () => {
    describe('doGet', () => {
      it('should pass ageWeightKey and formatted date time to view', async () => {
        const request = {}
        const handler = new AgeWeightKeyOkHandler('age-weight-key-ok')
        const h = getMockH()
        const mockCacheContext = {
          ageWeightKey: { year: '2025', gateName: 'Gate A', gateId: 'g1' }
        }
        BaseHandler.prototype.getCacheContext = jest.fn().mockResolvedValue(mockCacheContext)
        BaseHandler.prototype.readCacheAndDisplayView = jest.fn()

        const mockNow = 'Thursday 20th November 2025 at 10:49am'
        jest.spyOn(moment.prototype, 'format').mockReturnValue(mockNow)

        await handler.doGet(request, h)

        expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
          request,
          h,
          {
            ageWeightKey: mockCacheContext.ageWeightKey,
            now: mockNow
          }
        )
      })
    })
  })
})
