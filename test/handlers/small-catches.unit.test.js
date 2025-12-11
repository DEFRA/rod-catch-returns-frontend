const mockSubmissionGetById = jest.fn()
const mockChangeExclusion = jest.fn()
const mockSmallCatchGetAllChildren = jest.fn()
const mockSmallCatchGetById = jest.fn()
const mockSmallCatchDoMap = jest.fn()
const mockActivitiesGetFromLink = jest.fn()
const mockListMethods = jest.fn()
const mockTestLocked = jest.fn()
const mockIsAllowedParam = jest.fn()

const { SmallCatchHandler, SmallCatchHandlerClear } = require('../../src/handlers/small-catches')
const BaseHandler = require('../../src/handlers/base')
const ResponseError = require('../../src/handlers/response-error')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions', () => jest.fn(() => ({
  getById: mockSubmissionGetById,
  changeExclusion: mockChangeExclusion
})))

jest.mock('../../src/api/small-catches', () => jest.fn(() => ({
  getAllChildren: mockSmallCatchGetAllChildren,
  getById: mockSmallCatchGetById,
  doMap: mockSmallCatchDoMap
})))

jest.mock('../../src/api/activities', () => jest.fn(() => ({
  getFromLink: mockActivitiesGetFromLink
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
    jest.resetAllMocks()
    process.env = { ...OLD_ENV }
  })

  const getMockRequest = ({
    cacheObj = {
      submissionId: 'sub-1',
      licenceNumber: 'LIC',
      postcode: 'PC1',
      year: 2025
    },
    payload = {},
    params = { id: 'add' }
  } = {}) => {
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

  const getMockSubmission = () => ({
    _links: {
      activities: {
        href: '/activities'
      }
    }
  })

  const getMockActivities = () => [
    {
      id: 'act1',
      river: {
        id: 'r1'
      },
      _links: {
        self: {
          href: 'act1'
        }
      }
    }
  ]

  const getMockMethods = () => [{ id: 'm1', internal: false }]

  describe('doGet', () => {
    const setupCommonFlags = ({ allowed = true, locked = false } = {}) => {
      mockIsAllowedParam.mockReturnValue(allowed)
      mockTestLocked.mockResolvedValue(locked)
    }

    const setupApis = ({
      submissionGetById,
      activitiesGetFromLink,
      smallCatchGetAllChildren,
      smallCatchGetById,
      smallCatchDoMap,
      listMethods
    } = {}) => {
      if (submissionGetById) mockSubmissionGetById.mockResolvedValueOnce(submissionGetById)
      if (activitiesGetFromLink) mockActivitiesGetFromLink.mockResolvedValueOnce(activitiesGetFromLink)
      if (smallCatchGetAllChildren) mockSmallCatchGetAllChildren.mockResolvedValueOnce(smallCatchGetAllChildren)
      if (smallCatchGetById) mockSmallCatchGetById.mockResolvedValueOnce(smallCatchGetById)
      if (smallCatchDoMap) mockSmallCatchDoMap.mockResolvedValueOnce(smallCatchDoMap)
      if (listMethods) mockListMethods.mockResolvedValueOnce(listMethods)
    }

    it('should redirect to summary when monthsFiltered is empty', async () => {
      const request = getMockRequest({ cacheObj: { submissionId: 'sub-1', licenceNumber: 'LIC', postcode: 'PC1', year: 2025, add: { river: 'r1' } } })
      const h = getMockH()
      setupCommonFlags()
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
      setupApis({
        submissionGetById: getMockSubmission(),
        activitiesGetFromLink: getMockActivities(),
        smallCatchGetAllChildren: allMonths,
        listMethods: getMockMethods()
      })
      const handler = new SmallCatchHandler('small-catches')

      await handler.doGet(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/summary')
    })

    it('should filter months when single river and show add view', async () => {
      const request = getMockRequest()
      const h = getMockH()
      setupCommonFlags()
      // rivers derived from activities; simulate only one river passed to add by making activities match rivers length 1
      const activities = [
        { id: 'act1', river: { id: 'r1' }, _links: { self: { href: 'act1' } } },
        { id: 'act2', river: { id: 'r2' }, _links: { self: { href: 'act2' } } }
      ]
      // smallCatches has only one month used for act1 so monthsFiltered will be non-empty
      const smallCatches = [{ activity: { id: 'act1' }, month: 'JANUARY' }]
      setupApis({
        submissionGetById: getMockSubmission(),
        activitiesGetFromLink: activities,
        smallCatchGetAllChildren: smallCatches,
        listMethods: getMockMethods()
      })
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')
      const handler = new SmallCatchHandler('small-catches')

      await handler.doGet(request, h, {})

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
      const request = getMockRequest({ params: { id: '123' } })
      const h = getMockH()
      setupCommonFlags()
      setupApis({
        submissionGetById: getMockSubmission(),
        activitiesGetFromLink: getMockActivities(),
        smallCatchGetById: null,
        listMethods: getMockMethods()
      })
      const handler = new SmallCatchHandler('small-catches')

      await expect(handler.doGet(request, h, {})).rejects.toMatchObject({
        message: 'Unauthorized access to small catch',
        statusCode: ResponseError.status.UNAUTHORIZED
      })
    })

    it('should throw ResponseError if the parameter is not allowed', async () => {
      const cacheObj = { submissionId: 'sub-1', licenceNumber: 'LIC', postcode: 'PC1', year: 2025 }
      const request = getMockRequest({ cacheObj, params: { id: '123' } })
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(false)
      const handler = new SmallCatchHandler('small-catches')

      await expect(handler.doGet(request, h, [], cacheObj, [], [])).rejects.toMatchObject({
        message: 'Unknown small catch',
        statusCode: ResponseError.status.UNAUTHORIZED
      })
    })

    it('should throw ResponseError if activity mismatch', async () => {
      const handler = new SmallCatchHandler('small-catches')
      const request = getMockRequest({ params: { id: '123' } })
      const h = getMockH()
      setupCommonFlags()
      // small catch belongs to activity 'act-different'
      const smallCatch = {
        id: 'sc1',
        _links: { activityEntity: { href: 'act-different' } }
      }
      setupApis({
        submissionGetById: getMockSubmission(),
        activitiesGetFromLink: getMockActivities(),
        smallCatchGetById: smallCatch,
        listMethods: getMockMethods()
      })

      await expect(handler.doGet(request, h, {})).rejects.toMatchObject({
        message: 'Unauthorized access to small catch',
        statusCode: ResponseError.status.UNAUTHORIZED
      })
    })

    it('should include noMonthRecorded and map counts into payload', async () => {
      const handler = new SmallCatchHandler('small-catches')
      const request = getMockRequest({ params: { id: '123' } })
      const h = getMockH()
      setupCommonFlags()
      const smallCatch = {
        id: 'sc1',
        activity: { river: { id: 'r1' } },
        released: true,
        month: 'MARCH',
        noMonthRecorded: true,
        counts: [{ name: 'Trout', count: 2 }, { name: 'Salmon', count: 1 }],
        _links: { activityEntity: { href: 'act1' } }
      }
      setupApis({
        submissionGetById: getMockSubmission(),
        activitiesGetFromLink: getMockActivities(),
        smallCatchGetById: smallCatch,
        smallCatchDoMap: smallCatch,
        listMethods: getMockMethods()
      })
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

      await handler.doGet(request, h, {})

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

    it('should filter out internal rivers and methods when CONTEXT=ANGLER', async () => {
      process.env.CONTEXT = 'ANGLER'
      const request = getMockRequest()
      const h = getMockH()
      setupCommonFlags()
      const activities = [
        { river: { id: 'r1', internal: false } },
        { river: { id: 'r2', internal: true } }
      ]
      setupApis({
        submissionGetById: getMockSubmission(),
        activitiesGetFromLink: activities,
        smallCatchGetAllChildren: [],
        listMethods: getMockMethods()
      })
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
      const request = getMockRequest()
      const h = getMockH()
      setupCommonFlags({ locked: true })
      setupApis({
        submissionGetById: getMockSubmission(),
        activitiesGetFromLink: getMockActivities(),
        listMethods: getMockMethods()
      })
      const handler = new SmallCatchHandler('small-catches')

      await handler.doGet(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/review')
    })
  })

  describe('doPost', () => {
    it('should skip exclusion change when errors present', async () => {
      const cacheObj = { submissionId: 'sub-1' }
      const request = getMockRequest({ cacheObj, params: { id: '123' } })
      const h = getMockH()
      mockSubmissionGetById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: true })
      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')
      const handler = new SmallCatchHandler('small-catches')

      const result = await handler.doPost(request, h, ['error'])

      expect(mockChangeExclusion).not.toHaveBeenCalled()
      expect(BaseHandler.prototype.writeCacheAndRedirect).toHaveBeenCalled()
      expect(result).toBe('redirect-result')
    })

    it('should redirect to add when add payload present', async () => {
      const cacheObj = { submissionId: 'sub-1' }
      const request = getMockRequest({ cacheObj, payload: { add: true, river: 'r1' }, params: { id: '123' } })
      const h = getMockH()
      mockSubmissionGetById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: true })
      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')
      const handler = new SmallCatchHandler('small-catches')

      await handler.doPost(request, h, null)

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
    it('should call super.doGet', async () => {
      const cacheObj = { submissionId: 'sub-1' }
      const request = getMockRequest({ cacheObj })
      const h = getMockH()
      BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn().mockResolvedValueOnce()
      const superDoGetSpy = jest.spyOn(SmallCatchHandler.prototype, 'doGet').mockResolvedValueOnce('super-result')
      const handlerClear = new SmallCatchHandlerClear('small-catches')

      await handlerClear.doGet(request, h)

      expect(superDoGetSpy).toHaveBeenCalledWith(request, h)
    })
  })
})
