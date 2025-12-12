const { SalmonAndLargeTroutHandler, SalmonAndLargeTroutHandlerClear } = require('../../src/handlers/salmon-and-large-trout')
const BaseHandler = require('../../src/handlers/base')
const ResponseError = require('../../src/handlers/response-error')
const { getMockH } = require('../test-utils/server-test-utils')
const SubmissionsApi = require('../../src/api/submissions')
const ActivitiesApi = require('../../src/api/activities')
const MethodsApi = require('../../src/api/methods')
const Common = require('../../src/handlers/common')
const SpeciesApi = require('../../src/api/species')
const CatchesApi = require('../../src/api/catches')

jest.mock('../../src/api/submissions')
jest.mock('../../src/api/catches')
jest.mock('../../src/api/activities')
jest.mock('../../src/api/methods')
jest.mock('../../src/api/species')
jest.mock('../../src/handlers/common')

describe('salmon-large-trout-handler.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
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

  const getMockSubmission = (overrides) => ({
    id: 'submissions/1',
    _links: {
      activities: {
        href: '/activities'
      }
    },
    ...overrides
  })

  const getMockActivities = () => [
    {
      river: {
        id: 'r1',
        internal: false
      },
      _links: {
        self: {
          href: 'act1'
        }
      }
    }
  ]

  const getMockMethods = () => [
    {
      id: 'm1',
      internal: false
    }
  ]

  const getMockSpecies = () => [
    {
      id: 's1'
    }
  ]

  const getMockCatch = () => ({
    id: 'c1',
    dateCaught: '2025-05-01',
    activity: { river: { id: 'r1' } },
    species: { id: 's1' },
    mass: { oz: 32, kg: 2, type: 'imperial' },
    method: { id: 'm1' },
    released: true,
    _links: { activityEntity: { href: 'act1' } }
  })

  const setupCommonFlags = ({ allowed = true, locked = false } = {}) => {
    Common.isAllowedParam.mockReturnValueOnce(allowed)
    Common.testLocked.mockReturnValueOnce(locked)
  }

  const setupApis = ({
    submissionGetById,
    activitiesGetFromLink,
    smallCatchGetAllChildren,
    catchGetById,
    catchDoMap,
    listMethods,
    listSpecies
  } = {}) => {
    const [submissionsApi] = SubmissionsApi.mock.instances
    if (submissionGetById) submissionsApi.getById.mockResolvedValueOnce(submissionGetById)

    const [activitiesApi] = ActivitiesApi.mock.instances
    if (activitiesGetFromLink) activitiesApi.getFromLink.mockResolvedValueOnce(activitiesGetFromLink)
    /*
     * if (smallCatchGetAllChildren) mockSmallCatchGetAllChildren.mockResolvedValueOnce(smallCatchGetAllChildren)
     * if (smallCatchGetById) mockSmallCatchGetById.mockResolvedValueOnce(smallCatchGetById)
     * if (smallCatchDoMap) mockSmallCatchDoMap.mockResolvedValueOnce(smallCatchDoMap)
     */

    const [catchesApi] = CatchesApi.mock.instances
    if (catchGetById) catchesApi.getById.mockResolvedValueOnce(catchGetById)
    if (catchDoMap) catchesApi.doMap.mockResolvedValueOnce(catchDoMap)

    const [methodsApi] = MethodsApi.mock.instances
    if (listMethods) methodsApi.list.mockResolvedValueOnce(listMethods)

    const [speciesApi] = SpeciesApi.mock.instances
    if (listSpecies) speciesApi.list.mockResolvedValueOnce(listSpecies)
  }

  describe('SalmonAndLargeTroutHandler', () => {
    describe('doGet', () => {
      it('should throw ResponseError if param not allowed', async () => {
        const request = getMockRequest({}, {}, { id: 'bad' })
        const h = getMockH()
        Common.isAllowedParam.mockReturnValueOnce(false)
        const handler = new SalmonAndLargeTroutHandler('catches')

        await expect(handler.doGet(request, h)).rejects.toThrow(ResponseError.Error)
      })

      it('should redirect to review if submission locked', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'sub-1' })
        const h = getMockH()
        setupCommonFlags({ locked: true })
        setupApis({
          submissionGetById: getMockSubmission(),
          activitiesGetFromLink: getMockActivities(),
          listMethods: getMockMethods()
        })

        await handler.doGet(request, h)

        expect(h.redirect).toHaveBeenCalledWith('/review')
      })

      it('should call readCacheAndDisplayView with add when id=add', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'submissions/1', licenceNumber: 'AAA-111', postcode: 'AA11 1AA', year: 2025 })
        const h = getMockH()
        setupCommonFlags()
        setupApis({
          submissionGetById: getMockSubmission(),
          activitiesGetFromLink: getMockActivities(),
          listMethods: getMockMethods(),
          listSpecies: getMockSpecies()
        })
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
        setupCommonFlags()
        setupApis({
          submissionGetById: getMockSubmission(),
          activitiesGetFromLink: getMockActivities(),
          listMethods: getMockMethods(),
          listSpecies: getMockSpecies(),
          catchGetById: getMockCatch(),
          catchDoMap: getMockCatch()
        })
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
        setupCommonFlags()
        setupApis({
          submissionGetById: getMockSubmission(),
          activitiesGetFromLink: getMockActivities(),
          listMethods: getMockMethods(),
          listSpecies: getMockSpecies(),
          catchGetById: null
        })

        await expect(handler.doGet(request, h)).rejects.toMatchObject({
          message: 'Unauthorized access to large catch',
          statusCode: ResponseError.status.UNAUTHORIZED
        })
      })

      it('should throw ResponseError if catch activity does not match submission activities', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'sub-1', year: 2025 }, {}, { id: '123' })
        const h = getMockH()
        setupCommonFlags()
        setupApis({
          submissionGetById: getMockSubmission(),
          activitiesGetFromLink: getMockActivities(),
          listMethods: getMockMethods(),
          listSpecies: getMockSpecies(),
          catchGetById: {
            id: 'c1',
            dateCaught: '2025-05-01',
            activity: { river: { id: 'r1' } },
            species: { id: 's1' },
            mass: { oz: 32, kg: 2, type: 'imperial' },
            method: { id: 'm1' },
            released: true,
            _links: { activityEntity: { href: 'different-act' } }
          }
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
        setupCommonFlags()
        setupApis({
          submissionGetById: getMockSubmission(),
          activitiesGetFromLink: getMockActivities(),
          listMethods: getMockMethods(),
          listSpecies: getMockSpecies(),
          catchGetById: {
            _links: { activityEntity: { href: 'act1' } }
          },
          catchDoMap: {
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
          }
        })

        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

        await handler.doGet(request, h)

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
      })

      it('should filter out internal rivers/methods when CONTEXT=ANGLER', async () => {
        process.env.CONTEXT = 'ANGLER'
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'sub-1', year: 2025 }, {}, { id: 'add' })
        const h = getMockH()
        setupCommonFlags()
        setupApis({
          submissionGetById: getMockSubmission(),
          activitiesGetFromLink: [
            { river: { id: 'r1', internal: false } },
            { river: { id: 'r2', internal: true } }
          ],
          listMethods: [
            { id: 'm1', internal: false },
            { id: 'm2', internal: true }
          ],
          listSpecies: getMockSpecies()
        })
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

      it('should return internal rivers/methods when CONTEXT=FMT', async () => {
        process.env.CONTEXT = 'FMT'
        const handler = new SalmonAndLargeTroutHandler('catches')
        const request = getMockRequest({ submissionId: 'sub-1', year: 2025 }, {}, { id: 'add' })
        const h = getMockH()
        setupCommonFlags()
        setupApis({
          submissionGetById: getMockSubmission(),
          activitiesGetFromLink: [
            { river: { id: 'r1', internal: false } },
            { river: { id: 'r2', internal: true } }
          ],
          listMethods: [
            { id: 'm1', internal: false },
            { id: 'm2', internal: true }
          ],
          listSpecies: getMockSpecies()
        })
        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

        await handler.doGet(request, h)

        expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
          request,
          h,
          expect.objectContaining({
            rivers: [{ id: 'r1', internal: false }, { id: 'r2', internal: true }],
            methods: [{ id: 'm1', internal: false }, { id: 'm2', internal: true }]
          })
        )
      })

      it('should filter rivers by cache.add.river in add', async () => {
        const handler = new SalmonAndLargeTroutHandler('catches')
        const cacheObj = { submissionId: 'sub-1', year: 2025, add: { river: 'r2' } }
        const request = getMockRequest(cacheObj, {}, { id: 'add' })
        const h = getMockH()
        setupCommonFlags()
        setupApis({
          submissionGetById: getMockSubmission(),
          activitiesGetFromLink: [
            { river: { id: 'r1', internal: false } },
            { river: { id: 'r2', internal: false } }
          ],
          listMethods: [
            { id: 'm1', internal: false },
            { id: 'm2', internal: true }
          ],
          listSpecies: getMockSpecies()
        })

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
        const request = getMockRequest({ submissionId: 'sub-1' }, {}, { id: '123' })
        const h = getMockH()
        const [submissionsApi] = SubmissionsApi.mock.instances
        submissionsApi.getById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: true })
        BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')

        await handler.doPost(request, h, ['error'])

        expect(submissionsApi.changeExclusion).not.toHaveBeenCalled()
      })
    })

    describe('doPost', () => {
      it('should clear exclusion when add payload present', async () => {
        const request = getMockRequest({ submissionId: 'sub-1' }, { add: true, river: 'r1' }, { id: '123' })
        const h = getMockH()
        const [submissionsApi] = SubmissionsApi.mock.instances
        submissionsApi.getById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: true })
        BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')
        const handler = new SalmonAndLargeTroutHandler('catches')

        await handler.doPost(request, h, null)

        expect(submissionsApi.changeExclusion).toHaveBeenCalledWith(request, 'sub-1', false)
      })

      it('should redirect to confirmation when add payload present', async () => {
        const cacheObj = { submissionId: 'sub-1' }
        const request = getMockRequest(cacheObj, { add: true, river: 'r1' }, { id: '123' })
        const h = getMockH()
        const [submissionsApi] = SubmissionsApi.mock.instances
        submissionsApi.getById.mockResolvedValueOnce({ id: 'sub-1', reportingExclude: true })
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
        const [submissionsApi] = SubmissionsApi.mock.instances
        submissionsApi.getById.mockResolvedValueOnce(getMockSubmission())
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
