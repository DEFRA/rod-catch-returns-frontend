const mockGetById = jest.fn()
const mockChangeExclusion = jest.fn()
const mockGetCatchById = jest.fn()
const mockDoMap = jest.fn()
const mockGetActivitiesFromLink = jest.fn()
const mockListMethods = jest.fn()
const mockListSpecies = jest.fn()
const mockTestLocked = jest.fn()
const mockIsAllowedParam = jest.fn()

const { SalmonAndLargeTroutHandler, SalmonAndLargeTroutHandlerClear } = require('../../src/handlers/salmon-and-large-trout')
const BaseHandler = require('../../src/handlers/base')
const ResponseError = require('../../src/handlers/response-error')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetById,
    changeExclusion: mockChangeExclusion
  }))
})
jest.mock('../../src/api/catches', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetCatchById,
    doMap: mockDoMap
  }))
})
jest.mock('../../src/api/activities', () => {
  return jest.fn().mockImplementation(() => ({
    getFromLink: mockGetActivitiesFromLink
  }))
})
jest.mock('../../src/api/methods', () => {
  return jest.fn().mockImplementation(() => ({
    list: mockListMethods
  }))
})
jest.mock('../../src/api/species', () => {
  return jest.fn().mockImplementation(() => ({
    list: mockListSpecies
  }))
})
jest.mock('../../src/handlers/common', () => ({
  testLocked: (...args) => mockTestLocked(...args),
  isAllowedParam: (...args) => mockIsAllowedParam(...args)
}))

// TODO fix

describe('salmon-large-trout-handler.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  const getMockRequest = (cacheObj = {}, payload = {}, params = { id: 'add' }) => ({
    path: '/catches/add',
    params,
    payload,
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValueOnce(cacheObj),
      set: jest.fn().mockResolvedValueOnce()
    }))
  })

  describe('SalmonAndLargeTroutHandler', () => {
    describe('doGet', () => {
      it('should throw ResponseError if param not allowed', async () => {
        const request = getMockRequest({}, {}, { id: 'bad' })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValueOnce(false)
        const handler = new SalmonAndLargeTroutHandler('catches')

        await expect(handler.doGet(request, h)).rejects.toThrow(ResponseError.Error)
      })

      it('should redirect to review if submission locked', async () => {
        const request = getMockRequest({ submissionId: 'sub-1' })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValueOnce(true)
        mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValueOnce([{ river: { id: 'r1', internal: false } }])
        mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
        mockTestLocked.mockResolvedValueOnce(true)
        const handler = new SalmonAndLargeTroutHandler('catches')

        await handler.doGet(request, h)

        expect(h.redirect).toHaveBeenCalledWith('/review')
      })

      it('should call readCacheAndDisplayView with add when id=add', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'submissions/1', licenceNumber: 'AAA-111', postcode: 'AA11 1AA', year: 2025 })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValueOnce(true)
        mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValueOnce([{ river: { id: 'r1', internal: false } }])
        mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
        mockListSpecies.mockResolvedValueOnce([{ id: 's1' }])
        mockTestLocked.mockResolvedValueOnce(false)

        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

        await handler.doGet(request, h)

        expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
          request,
          h,
          {
            add: true,
            details: {
              licenceNumber: 'AAA-111',
              postcode: 'AA11 1AA',
              year: 2025
            },
            methods: [{
              id: 'm1',
              internal: false
            }],
            rivers: [{
              id: 'r1',
              internal: false
            }],
            types: [{
              id: 's1'
            }],
            year: 2025
          })
      })

      it('should call readCacheAndDisplayView with no add if id!=add', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'submissions/1', licenceNumber: 'AAA-111', postcode: 'AA11 1AA', year: 2025 }, {}, { id: '123' })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValueOnce(true)
        mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValueOnce([{ river: { id: 'r1', internal: false }, _links: { self: { href: 'act1' } } }])
        mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
        mockListSpecies.mockResolvedValueOnce([{ id: 's1' }])
        mockTestLocked.mockResolvedValueOnce(false)
        mockGetCatchById.mockResolvedValueOnce({
          id: 'c1',
          dateCaught: '2025-05-01',
          activity: { river: { id: 'r1' } },
          species: { id: 's1' },
          mass: { oz: 32, kg: 2, type: 'imperial' },
          method: { id: 'm1' },
          released: true,
          _links: { activityEntity: { href: 'act1' } }
        })
        mockDoMap.mockResolvedValueOnce({ id: 'c1', dateCaught: '2025-05-01', activity: { river: { id: 'r1' } }, species: { id: 's1' }, mass: { oz: 32, kg: 2, type: 'imperial' }, method: { id: 'm1' }, released: true, _links: { activityEntity: { href: 'act1' } } })
        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

        await handler.doGet(request, h)

        expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
          request,
          h,
          {
            details: {
              licenceNumber: 'AAA-111',
              postcode: 'AA11 1AA',
              year: 2025
            },
            methods: [{ id: 'm1', internal: false }],
            payload: {
              day: '01',
              kilograms: 2,
              method: 'm1',
              month: '05',
              ounces: 0,
              pounds: 2,
              released: 'true',
              river: 'r1',
              system:
            'imperial',
              type: 's1'
            },
            rivers: [{ id: 'r1', internal: false }],
            types: [{ id: 's1' }],
            year: 2025
          })
      })

      it('should throw ResponseError if catch not found in change', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'sub-1', year: 2025 }, {}, { id: '123' })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValueOnce(true)
        mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValueOnce([{
          river: {
            id: 'r1',
            internal: false
          },
          _links: {
            self: {
              href: 'act1'
            }
          }
        }])
        mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
        mockListSpecies.mockResolvedValueOnce([{ id: 's1' }])
        mockTestLocked.mockResolvedValueOnce(false)
        mockGetCatchById.mockResolvedValueOnce(null) // simulate missing catch

        await expect(handler.doGet(request, h)).rejects.toMatchObject({
          message: 'Unauthorized access to large catch',
          statusCode: ResponseError.status.UNAUTHORIZED
        })
      })

      it('should throw ResponseError if catch activity does not match submission activities', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'sub-1', year: 2025 }, {}, { id: '123' })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValueOnce(true)
        mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValueOnce([{
          river: {
            id: 'r1',
            internal: false
          },
          _links: {
            self: {
              href: 'act1'
            }
          }
        }])
        mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
        mockListSpecies.mockResolvedValueOnce([{ id: 's1' }])
        mockTestLocked.mockResolvedValueOnce(false)
        mockGetCatchById.mockResolvedValueOnce({
          id: 'c1',
          dateCaught: '2025-05-01',
          activity: { river: { id: 'r1' } },
          species: { id: 's1' },
          mass: { oz: 32, kg: 2, type: 'imperial' },
          method: { id: 'm1' },
          released: true,
          _links: { activityEntity: { href: 'different-act' } }
        })

        await expect(handler.doGet(request, h)).rejects.toMatchObject({
          message: 'Unauthorized access to large catch',
          statusCode: ResponseError.status.UNAUTHORIZED
        })
      })

      it('should include noDateRecorded and onlyMonthRecorded flags in payload', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'sub-1', year: 2025 }, {}, { id: '123' })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValueOnce(true)
        mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValueOnce([{ river: { id: 'r1', internal: false }, _links: { self: { href: 'act1' } } }])
        mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
        mockListSpecies.mockResolvedValueOnce([{ id: 's1' }])
        mockTestLocked.mockResolvedValueOnce(false)
        mockGetCatchById.mockResolvedValueOnce({
          id: 'c1',
          dateCaught: '2025-05-01',
          activity: { river: { id: 'r1' } },
          species: { id: 's1' },
          mass: { oz: 32, kg: 2, type: 'imperial' },
          method: { id: 'm1' },
          released: false,
          noDateRecorded: true,
          onlyMonthRecorded: true,
          _links: { activityEntity: { href: 'act1' } }
        })
        mockDoMap.mockResolvedValueOnce({
          id: 'c1',
          dateCaught: '2025-05-01',
          activity: { river: { id: 'r1' } },
          species: { id: 's1' },
          mass: { oz: 32, kg: 2, type: 'imperial' },
          method: { id: 'm1' },
          released: false,
          noDateRecorded: true,
          onlyMonthRecorded: true,
          _links: { activityEntity: { href: 'act1' } }
        })

        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

        const result = await handler.doGet(request, h)
        expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
          request,
          h,
          expect.objectContaining({
            payload: expect.objectContaining({
              noDateRecorded: 'true',
              onlyMonthRecorded: 'true'
            })
          })
        )
        expect(result).toBe('view-result')
      })

      it('should filter out internal rivers/methods when CONTEXT=ANGLER', async () => {
        process.env.CONTEXT = 'ANGLER'
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'sub-1', year: 2025 }, {}, { id: 'add' })
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
        mockListSpecies.mockResolvedValueOnce([{ id: 's1' }])
        mockTestLocked.mockResolvedValueOnce(false)

        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

        await handler.doGet(request, h)

        expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
          request,
          h,
          expect.objectContaining({
            rivers: [{ id: 'r1', internal: false }],
            methods: [{ id: 'm1', internal: false }]
          })
        )
      })

      it('should filter rivers by cache.add.river in add', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const cacheObj = { submissionId: 'sub-1', year: 2025, add: { river: 'r2' } }
        const request = getMockRequest(cacheObj, {}, { id: 'add' })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValueOnce(true)
        mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValueOnce([
          { river: { id: 'r1', internal: false } },
          { river: { id: 'r2', internal: false } }
        ])
        mockListMethods.mockResolvedValueOnce([{ id: 'm1', internal: false }])
        mockListSpecies.mockResolvedValueOnce([{ id: 's1' }])
        mockTestLocked.mockResolvedValueOnce(false)

        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

        await handler.doGet(request, h)

        expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
          request,
          h,
          expect.objectContaining({
            rivers: [{ id: 'r2', internal: false }]
          })
        )
      })

      it('should skip exclusion change when errors are present in doPost', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
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
    })

    describe('doPost', () => {
      it('should clear exclusion when add payload present', async () => {
        const cacheObj = { submissionId: 'sub-1' }
        const request = getMockRequest(cacheObj, { add: true, river: 'r1' }, { id: '123' })
        const h = getMockH()
        mockGetById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: true })
        BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')
        const handler = new SalmonAndLargeTroutHandler('catches')

        await handler.doPost(request, h, null)

        expect(mockChangeExclusion).toHaveBeenCalledWith(request, 'sub-1', false)
      })

      it('should redirect to confirmation when add payload present', async () => {
        const cacheObj = { submissionId: 'sub-1' }
        const request = getMockRequest(cacheObj, { add: true, river: 'r1' }, { id: '123' })
        const h = getMockH()
        mockGetById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: true })
        BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')
        const handler = new SalmonAndLargeTroutHandler('catches')

        await handler.doPost(request, h, null)

        expect(BaseHandler.prototype.writeCacheAndRedirect).toHaveBeenCalledWith(
          request,
          h,
          null,
          '/catches/add',
          '/catches/123',
          cacheObj
        )
      })

      it('should redirect to summary when no add payload', async () => {
        const cacheObj = { submissionId: 'sub-1', add: { river: 'r1' } }
        const request = getMockRequest(cacheObj, {}, { id: '123' })
        const h = getMockH()
        mockGetById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: false })
        BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')
        const handler = new SalmonAndLargeTroutHandler('catches')

        await handler.doPost(request, h, null)

        expect(BaseHandler.prototype.writeCacheAndRedirect).toHaveBeenCalledWith(
          request,
          h,
          null,
          '/summary',
          '/catches/123',
          cacheObj
        )
      })
    })
  })

  describe('SalmonAndLargeTroutHandlerClear', () => {
    describe('doGet', () => {
      it('should call clearCacheErrorsAndPayload with request', async () => {
        const handlerClear = new SalmonAndLargeTroutHandlerClear('catches')
        const request = getMockRequest()
        const h = getMockH()
        BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn().mockResolvedValueOnce()
        jest.spyOn(SalmonAndLargeTroutHandler.prototype, 'doGet').mockResolvedValueOnce('super-result')

        await handlerClear.doGet(request, h)

        expect(BaseHandler.prototype.clearCacheErrorsAndPayload).toHaveBeenCalledWith(request)
      })

      it('should call super.doGet', async () => {
        const handlerClear = new SalmonAndLargeTroutHandlerClear('catches')
        const request = getMockRequest()
        const h = getMockH()
        BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn().mockResolvedValueOnce()
        const superDoGetSpy = jest.spyOn(SalmonAndLargeTroutHandler.prototype, 'doGet').mockResolvedValueOnce('super-result')

        await handlerClear.doGet(request, h)

        expect(superDoGetSpy).toHaveBeenCalledWith(request, h)
      })
    })
  })
})
