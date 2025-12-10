const mockGetById = jest.fn()
const mockChangeExclusion = jest.fn()
const mockGetAllChildren = jest.fn()
const mockGetSmallCatchById = jest.fn()
const mockDoMap = jest.fn()
const mockGetActivitiesFromLink = jest.fn()
const mockListMethods = jest.fn()
const mockTestLocked = jest.fn()
const mockIsAllowedParam = jest.fn()

const { SmallCatchHandler, SmallCatchHandlerClear } = require('../../src/handlers/small-catches')
const BaseHandler = require('../../src/handlers/base')
const ResponseError = require('../../src/handlers/response-error')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions', () => jest.fn(() => ({
  getById: mockGetById,
  changeExclusion: mockChangeExclusion
})))

jest.mock('../../src/api/small-catches', () => jest.fn(() => ({
  getAllChildren: mockGetAllChildren,
  getById: mockGetSmallCatchById,
  doMap: mockDoMap
})))

jest.mock('../../src/api/activities', () => jest.fn(() => ({
  getFromLink: mockGetActivitiesFromLink
})))

jest.mock('../../src/api/methods', () => jest.fn(() => ({
  list: mockListMethods
})))

jest.mock('../../src/handlers/common', () => ({
  testLocked: (...args) => mockTestLocked(...args),
  isAllowedParam: (...args) => mockIsAllowedParam(...args)
}))

describe('small-catch-handler.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  const getMockRequest = (cacheObj = {}, payload = {}, params = { id: 'add' }) => {
    const cacheApi = {
      get: jest.fn().mockResolvedValueOnce(cacheObj),
      set: jest.fn().mockResolvedValueOnce(),
      drop: jest.fn().mockResolvedValueOnce()
    }
    return {
      path: '/small-catches/add',
      params,
      payload,
      cache: jest.fn(() => cacheApi)
    }
  }

  describe('doGet', () => {
    it('should redirect to summary when monthsFiltered is empty', async () => {
      const cache = { submissionId: 'sub-1', licenceNumber: 'LIC', postcode: 'PC1', year: 2025, add: { river: 'r1' } }
      const request = getMockRequest(cache, {}, { id: 'add' })
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
      // activities include one activity for r1
      const activities = [{ id: 'act1', river: { id: 'r1' }, _links: { self: { href: 'act1' } } }]
      mockGetActivitiesFromLink.mockResolvedValueOnce(activities)
      // smallCatches already include all months for that activity
      const allMonths = [
        { activity: { id: 'act1' }, month: 'JANUARY' },
        { activity: { id: 'act1' }, month: 'FEBRUARY' },
        { activity: { id: 'act1' }, month: 'MARCH' },
        { activity: { id: 'act1' }, month: 'APRIL' },
        { activity: { id: 'act1' }, month: 'MAY' },
        { activity: { id: 'act1' }, month: 'JUNE' },
        { activity: { id: 'act1' }, month: 'JULY' },
        { activity: { id: 'act1' }, month: 'AUGUST' },
        { activity: { id: 'act1' }, month: 'SEPTEMBER' },
        { activity: { id: 'act1' }, month: 'OCTOBER' },
        { activity: { id: 'act1' }, month: 'NOVEMBER' },
        { activity: { id: 'act1' }, month: 'DECEMBER' }
      ]
      mockGetAllChildren.mockResolvedValueOnce(allMonths)
      mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
      mockTestLocked.mockResolvedValueOnce(false)
      const handler = new SmallCatchHandler('small-catches')

      const result = await handler.doGet(request, h)

      expect(result).toEqual(h.redirect('/summary'))
    })

    it('should filter months when single river and show add view', async () => {
      const cache = { submissionId: 'sub-1', licenceNumber: 'LIC', postcode: 'PC1', year: 2025 }
      const request = getMockRequest(cache, {}, { id: 'add' })
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
      const activities = [
        { id: 'act1', river: { id: 'r1' }, _links: { self: { href: 'act1' } } },
        { id: 'act2', river: { id: 'r2' }, _links: { self: { href: 'act2' } } }
      ]
      // rivers derived from activities; simulate only one river passed to add by making activities match rivers length 1
      mockGetActivitiesFromLink.mockResolvedValueOnce(activities)
      // smallCatches has only one month used for act1 so monthsFiltered will be non-empty
      mockGetAllChildren.mockResolvedValueOnce([{ activity: { id: 'act1' }, month: 'JANUARY' }])
      mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
      mockTestLocked.mockResolvedValueOnce(false)
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')
      const rivers = [{ id: 'r1', internal: false }]
      const methods = [{ id: 'm1', internal: false }]
      const handler = new SmallCatchHandler('small-catches')

      await handler.add(request, h, rivers, cache, methods, activities)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
        request,
        h,
        {
          add: true,
          rivers: expect.any(Array),
          methods: expect.any(Array),
          details: {
            licenceNumber: 'LIC',
            postcode: 'PC1',
            year: 2025
          }
        }
      )
    })

    it('should throw ResponseError if small catch not found', async () => {
      const cache = { submissionId: 'sub-1', licenceNumber: 'LIC', postcode: 'PC1', year: 2025 }
      const request = getMockRequest(cache, {}, { id: '123' })
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetSmallCatchById.mockResolvedValueOnce(null)
      const handler = new SmallCatchHandler('small-catches')

      await expect(handler.change(request, h, [], cache, [], [])).rejects.toMatchObject({
        message: 'Unauthorized access to small catch',
        statusCode: ResponseError.status.UNAUTHORIZED
      })
    })

    it('should throw ResponseError if activity mismatch', async () => {
      const handler = new SmallCatchHandler('small-catches')
      const cache = { submissionId: 'sub-1', licenceNumber: 'LIC', postcode: 'PC1', year: 2025 }
      const request = getMockRequest(cache, {}, { id: '123' })
      const h = getMockH()

      mockIsAllowedParam.mockReturnValueOnce(true)
      // small catch belongs to activity 'act-different'
      mockGetSmallCatchById.mockResolvedValueOnce({
        id: 'sc1',
        _links: { activityEntity: { href: 'act-different' } }
      })
      const activities = [{ _links: { self: { href: 'act1' } }, river: { id: 'r1' } }]

      await expect(handler.change(request, h, [], cache, [], activities)).rejects.toMatchObject({
        message: 'Unauthorized access to small catch',
        statusCode: ResponseError.status.UNAUTHORIZED
      })
    })

    it('should include noMonthRecorded and map counts into payload', async () => {
      const handler = new SmallCatchHandler('small-catches')
      const cache = { submissionId: 'sub-1', licenceNumber: 'LIC', postcode: 'PC1', year: 2025 }
      const request = getMockRequest(cache, {}, { id: '123' })
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      const smallCatch = {
        id: 'sc1',
        activity: { river: { id: 'r1' } },
        released: true,
        month: 'MARCH',
        noMonthRecorded: true,
        counts: [{ name: 'Trout', count: 2 }, { name: 'Salmon', count: 1 }],
        _links: { activityEntity: { href: 'act1' } }
      }
      mockGetSmallCatchById.mockResolvedValueOnce(smallCatch)
      mockDoMap.mockResolvedValueOnce(smallCatch)

      const rivers = [{ id: 'r1', internal: false }]
      const methods = [{ id: 'm1', internal: false }]
      const activities = [{ _links: { self: { href: 'act1' } } }]

      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

      await handler.change(request, h, rivers, cache, methods, activities)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
        request,
        h,
        {
          rivers: expect.any(Array),
          methods: expect.any(Array),
          details: {
            licenceNumber: 'LIC',
            postcode: 'PC1',
            year: 2025
          },
          payload: {
            river: 'r1',
            released: true,
            month: 'MARCH',
            noMonthRecorded: 'true',
            trout: 2,
            salmon: 1
          }
        }
      )
    })

    it.skip('should filter out internal rivers and methods when CONTEXT=ANGLER', async () => {
      process.env.CONTEXT = 'ANGLER'
      const cache = { submissionId: 'sub-1', licenceNumber: 'LIC', postcode: 'PC1', year: 2025 }
      const request = getMockRequest(cache, {}, { id: 'add' })
      const h = getMockH()

      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
      mockGetActivitiesFromLink.mockResolvedValueOnce([
        { river: { id: 'r1', internal: false } },
        { river: { id: 'r2', internal: true } }
      ])
      mockListMethods.mockResolvedValueOnce([
        { id: 'm1', internal: false },
        { id: 'm2', internal: true }
      ])
      mockTestLocked.mockResolvedValueOnce(false)
      mockGetAllChildren.mockResolvedValueOnce([])
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')
      const handler = new SmallCatchHandler('small-catches')

      await handler.doGet(request, h)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
        request,
        h,
        {
          add: true,
          details: {
            licenceNumber: 'LIC',
            postcode: 'PC1',
            year: 2025
          },
          rivers: [{ id: 'r1', internal: false }],
          methods: [{ id: 'm1', internal: false }]
        }
      )
    })

    it('should redirect to review when submission locked', async () => {
      const handler = new SmallCatchHandler('small-catches')
      const cache = { submissionId: 'sub-1' }
      const request = getMockRequest(cache, {}, { id: 'add' })
      const h = getMockH()

      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
      mockGetActivitiesFromLink.mockResolvedValueOnce([{ river: { id: 'r1', internal: false } }])
      mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
      mockTestLocked.mockResolvedValueOnce(true)

      const result = await handler.doGet(request, h)
      expect(result).toEqual(h.redirect('/review'))
    })
  })

  describe('doPost', () => {
    it('should skip exclusion change when errors present', async () => {
      const handler = new SmallCatchHandler('small-catches')
      const cacheObj = { submissionId: 'sub-1' }
      const request = getMockRequest(cacheObj, {}, { id: '123' })
      const h = getMockH()
      mockGetById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: true })
      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')

      const result = await handler.doPost(request, h, ['error'])
      expect(mockChangeExclusion).not.toHaveBeenCalled()
      expect(BaseHandler.prototype.writeCacheAndRedirect).toHaveBeenCalled()
      expect(result).toBe('redirect-result')
    })

    it('should set cache.add and redirect to add when add payload present', async () => {
      const handler = new SmallCatchHandler('small-catches')
      const cacheObj = { submissionId: 'sub-1' }
      const request = getMockRequest(cacheObj, { add: true, river: 'r1' }, { id: '123' })
      const h = getMockH()
      mockGetById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: true })
      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')

      await handler.doPost(request, h, null)

      expect(cacheObj.add).toEqual({ river: 'r1' })
      expect(BaseHandler.prototype.writeCacheAndRedirect).toHaveBeenCalledWith(
        request,
        h,
        null,
        '/small-catches/add',
        '/small-catches/123',
        cacheObj
      )
    })
  })

  describe('SmallCatchHandlerClear', () => {
    it('should clear cache errors and payload then call super.doGet', async () => {
      const handlerClear = new SmallCatchHandlerClear('small-catches')
      const cache = { submissionId: 'sub-1' }
      const request = getMockRequest(cache, {}, { id: 'add' })
      const h = getMockH()

      BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn().mockResolvedValueOnce()
      const superDoGetSpy = jest.spyOn(SmallCatchHandler.prototype, 'doGet').mockResolvedValueOnce('super-result')

      const result = await handlerClear.doGet(request, h)

      expect(BaseHandler.prototype.clearCacheErrorsAndPayload).toHaveBeenCalledWith(request)
      expect(superDoGetSpy).toHaveBeenCalledWith(request, h)
      expect(result).toBe('super-result')
    })
  })
})
