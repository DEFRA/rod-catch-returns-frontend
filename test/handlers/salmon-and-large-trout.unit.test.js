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

describe('salmon-large-trout-handler.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CONTEXT = ''
  })

  const getMockRequest = (cacheObj = {}, payload = {}, params = { id: 'add' }) => ({
    path: '/catches/add',
    params,
    payload,
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValue(cacheObj),
      set: jest.fn().mockResolvedValue()
    }))
  })

  describe('SalmonAndLargeTroutHandler', () => {
    describe('doGet', () => {
      it('should throw ResponseError if param not allowed', async () => {
        const request = getMockRequest({}, {}, { id: 'bad' })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValue(false)
        const handler = new SalmonAndLargeTroutHandler('catches')

        await expect(handler.doGet(request, h)).rejects.toThrow(ResponseError.Error)
      })

      it('should redirect to review if submission locked', async () => {
        const request = getMockRequest({ submissionId: 'sub-1' })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValue(true)
        mockGetById.mockResolvedValue({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValue([{ river: { id: 'r1', internal: false } }])
        mockListMethods.mockResolvedValue([{ id: 'm1', internal: false }])
        mockTestLocked.mockResolvedValue(true)
        const handler = new SalmonAndLargeTroutHandler('catches')

        await handler.doGet(request, h)

        expect(h.redirect).toHaveBeenCalledWith('/review')
      })

      it('should call readCacheAndDisplayView with add when id=add', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'submissions/1', licenceNumber: 'AAA-111', postcode: 'AA11 1AA', year: 2025 })
        const h = getMockH()
        mockIsAllowedParam.mockReturnValue(true)
        mockGetById.mockResolvedValue({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValue([{ river: { id: 'r1', internal: false } }])
        mockListMethods.mockResolvedValue([{ id: 'm1', internal: false }])
        mockListSpecies.mockResolvedValue([{ id: 's1' }])
        mockTestLocked.mockResolvedValue(false)

        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValue('view-result')

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
        mockIsAllowedParam.mockReturnValue(true)
        mockGetById.mockResolvedValue({ _links: { activities: { href: '/activities' } } })
        mockGetActivitiesFromLink.mockResolvedValue([{ river: { id: 'r1', internal: false }, _links: { self: { href: 'act1' } } }])
        mockListMethods.mockResolvedValue([{ id: 'm1', internal: false }])
        mockListSpecies.mockResolvedValue([{ id: 's1' }])
        mockTestLocked.mockResolvedValue(false)
        mockGetCatchById.mockResolvedValue({
          id: 'c1',
          dateCaught: '2025-05-01',
          activity: { river: { id: 'r1' } },
          species: { id: 's1' },
          mass: { oz: 32, kg: 2, type: 'imperial' },
          method: { id: 'm1' },
          released: true,
          _links: { activityEntity: { href: 'act1' } }
        })
        mockDoMap.mockResolvedValue({ id: 'c1', dateCaught: '2025-05-01', activity: { river: { id: 'r1' } }, species: { id: 's1' }, mass: { oz: 32, kg: 2, type: 'imperial' }, method: { id: 'm1' }, released: true, _links: { activityEntity: { href: 'act1' } } })
        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValue('view-result')

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
    })

    describe('doPost', () => {
      it('should clear exclusion when add payload present', async () => {
        const cacheObj = { submissionId: 'sub-1' }
        const request = getMockRequest(cacheObj, { add: true, river: 'r1' }, { id: '123' })
        const h = getMockH()
        mockGetById.mockResolvedValue({ id: 'sub-1', reportingExclude: true })
        BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValue('redirect-result')
        const handler = new SalmonAndLargeTroutHandler('catches')

        await handler.doPost(request, h, null)

        expect(mockChangeExclusion).toHaveBeenCalledWith(request, 'sub-1', false)
      })

      it('should redirect to confirmation when add payload present', async () => {
        const cacheObj = { submissionId: 'sub-1' }
        const request = getMockRequest(cacheObj, { add: true, river: 'r1' }, { id: '123' })
        const h = getMockH()
        mockGetById.mockResolvedValue({ id: 'sub-1', reportingExclude: true })
        BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValue('redirect-result')
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
        mockGetById.mockResolvedValue({ id: 'sub-1', reportingExclude: false })
        BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValue('redirect-result')
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
        BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn().mockResolvedValue()
        jest.spyOn(SalmonAndLargeTroutHandler.prototype, 'doGet').mockResolvedValue('super-result')

        await handlerClear.doGet(request, h)

        expect(BaseHandler.prototype.clearCacheErrorsAndPayload).toHaveBeenCalledWith(request)
      })

      it('should call super.doGet', async () => {
        const handlerClear = new SalmonAndLargeTroutHandlerClear('catches')
        const request = getMockRequest()
        const h = getMockH()
        BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn().mockResolvedValue()
        const superDoGetSpy = jest.spyOn(SalmonAndLargeTroutHandler.prototype, 'doGet').mockResolvedValue('super-result')

        await handlerClear.doGet(request, h)

        expect(superDoGetSpy).toHaveBeenCalledWith(request, h)
      })
    })
  })
})
