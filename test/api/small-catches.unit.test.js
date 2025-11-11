const SmallCatchesApi = require('../../src/api/small-catches')
const ActivityApi = require('../../src/api/activities')
const RiversApi = require('../../src/api/rivers')
const MethodsApi = require('../../src/api/methods')
const EntityApi = require('../../src/api/entity-api')
const { monthHelper } = require('../../src/handlers/common')
const ResponseError = require('../../src/handlers/response-error')

jest.mock('../../src/api/activities')
jest.mock('../../src/api/rivers')
jest.mock('../../src/api/methods')
jest.mock('../../src/handlers/common', () => ({
  monthHelper: {
    find: {
      numFromKey: jest.fn(),
      keyFromNum: jest.fn()
    }
  }
}))
jest.mock('../../src/handlers/response-error', () => ({
  status: {
    CONFLICT: 409
  }
}))

describe('small-catches.unit', () => {
  describe('constructor', () => {
    it('maps API response into formatted object', async () => {
      const fakeActivity = {
        id: '1',
        days: 3,
        _links: {
          river: {
            href: 'https://local/api/rivers/2'
          },
          self: {
            href: 'https://local/api/activities/1'
          }
        }
      }
      const fakeRiver = {
        id: '2',
        name: 'Avon',
        _links: {
          self: {
            href: 'https://local/api/rivers/2'
          }
        }
      }
      const fakeMethods = [
        { id: 'M1', name: 'Fly', internal: false },
        { id: 'M2', name: 'Spin', internal: true }
      ]

      ActivityApi.prototype.getFromLink.mockResolvedValueOnce(fakeActivity)
      RiversApi.prototype.getFromLink.mockResolvedValueOnce(fakeRiver)
      MethodsApi.prototype.list.mockResolvedValueOnce(fakeMethods)
      MethodsApi.prototype.getFromLink.mockImplementationOnce(async (_req, href) => ({ id: href }))
      MethodsApi.prototype.doMap.mockResolvedValueOnce({ name: 'Fly' })

      monthHelper.find.numFromKey.mockReturnValue(6)

      const input = {
        id: 'C1',
        month: 'JUN',
        released: true,
        noMonthRecorded: false,
        reportingExclude: false,
        counts: [
          { count: 10, _links: { method: { href: 'M1' } } }
        ],
        _links: {
          activity: {
            href: 'https://local/api/activities/1'
          },
          self: {
            href: 'https://local/api/smallCatches/22050'

          }
        }
      }

      const smallCatchesApi = new SmallCatchesApi()
      const result = await smallCatchesApi.doMap({}, input)

      expect(result).toEqual({
        id: 'smallCatches/22050',
        month: 6,
        counts: [
          { id: 'M1', name: 'Fly', count: 10, internal: false },
          { id: 'M2', name: 'Spin', count: null, internal: true }
        ],
        reportingExclude: false,
        released: true,
        noMonthRecorded: false,
        activity: {
          id: 'activities/1',
          days: 3,
          river: {
            id: 'rivers/2',
            name: 'Avon'
          }
        }
      })
    })
  })

  describe('add', () => {
    it('calls super.add with converted month and correct payload', async () => {
      const superAddMock = EntityApi.prototype.add = jest.fn()
      monthHelper.find.keyFromNum.mockReturnValue('APR')
      const request = {}

      const smallCatchesApi = new SmallCatchesApi()
      await smallCatchesApi.add(request, 'sub-1', 'act-1', 4, [{ c: 1 }], true, false)

      expect(superAddMock).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          submission: 'sub-1',
          activity: 'act-1',
          month: 'APR',
          released: true,
          counts: [{ c: 1 }],
          noMonthRecorded: false
        })
      )
    })
  })

  describe('change', () => {
    it('returns result immediately when super.change returns errors', async () => {
      EntityApi.prototype.change = jest.fn().mockResolvedValueOnce({
        errors: ['something bad']
      })

      const smallCatchesApi = new SmallCatchesApi()
      const result = await smallCatchesApi.change({}, 'C1', 'A1', 4, [], false, false)

      expect(result).toEqual({ errors: ['something bad'] })
    })

    it('changes association if mapped activity differs', async () => {
      EntityApi.prototype.change = jest.fn().mockResolvedValueOnce({ id: 'C1' })
      const request = {}
      EntityApi.prototype.changeAssoc = jest.fn().mockResolvedValueOnce({})
      const smallCatchesApi = new SmallCatchesApi()
      smallCatchesApi.doMap = jest.fn().mockResolvedValueOnce({
        activity: { id: 'A2' }
      })

      await smallCatchesApi.change(request, 'C1', 'A1', 9, [], false, false)

      expect(EntityApi.prototype.changeAssoc).toHaveBeenCalledWith(request, 'C1/activity', 'A1')
    })

    it('returns duplicate error on conflict when changing association', async () => {
      EntityApi.prototype.change = jest.fn().mockResolvedValueOnce({ id: 'C1' })
      EntityApi.prototype.changeAssoc = jest.fn().mockResolvedValueOnce({ statusCode: ResponseError.status.CONFLICT })
      const smallCatchesApi = new SmallCatchesApi()
      smallCatchesApi.doMap = jest.fn().mockResolvedValueOnce({
        activity: { id: 'A2' }
      })

      const result = await smallCatchesApi.change({}, 'C1', 'A1', 9, [], false, false)

      expect(result).toEqual({
        errors: [
          {
            entity: 'SmallCatch',
            message: 'SMALL_CATCH_DUPLICATE_FOUND'
          }
        ]
      })
    })
  })

  describe('changeExclusion', () => {
    it('calls super.change with reportingExclude', async () => {
      EntityApi.prototype.change = jest.fn()
      const request = {}

      const smallCatchesApi = new SmallCatchesApi()
      await smallCatchesApi.changeExclusion(request, 'C1', true)

      expect(EntityApi.prototype.change).toHaveBeenCalledWith(
        request,
        'C1',
        { reportingExclude: true }
      )
    })
  })

  describe('sort', () => {
    const buildCatch = (overrides = {}) => ({
      month: 6,
      noMonthRecorded: false,
      activity: {
        river: { name: 'Default River' }
      },
      ...overrides
    })

    it('returns -1 when a.month < b.month', () => {
      const a = buildCatch({ month: 1 })
      const b = buildCatch({ month: 2 })

      const smallCatchesApi = new SmallCatchesApi()
      expect(smallCatchesApi.sort(a, b)).toBe(-1)
    })

    it('returns 1 when a.month > b.month', () => {
      const a = buildCatch({ month: 5 })
      const b = buildCatch({ month: 3 })

      const smallCatchesApi = new SmallCatchesApi()
      expect(smallCatchesApi.sort(a, b)).toBe(1)
    })

    it('returns -1 when months equal and a.noMonthRecorded < b.noMonthRecorded', () => {
      const a = buildCatch({ noMonthRecorded: false })
      const b = buildCatch({ noMonthRecorded: true })

      const smallCatchesApi = new SmallCatchesApi()
      expect(smallCatchesApi.sort(a, b)).toBe(-1)
    })

    it('returns 1 when months equal and a.noMonthRecorded > b.noMonthRecorded', () => {
      const a = buildCatch({ noMonthRecorded: true })
      const b = buildCatch({ noMonthRecorded: false })

      const smallCatchesApi = new SmallCatchesApi()
      expect(smallCatchesApi.sort(a, b)).toBe(1)
    })

    it('returns -1 when months + noMonthRecorded equal and river name a < b', () => {
      const a = buildCatch({ activity: { river: { name: 'Amazon' } } })
      const b = buildCatch({ activity: { river: { name: 'Zambezi' } } })

      const smallCatchesApi = new SmallCatchesApi()
      expect(smallCatchesApi.sort(a, b)).toBe(-1)
    })

    it('returns 1 when months + noMonthRecorded equal and river name a > b', () => {
      const a = buildCatch({ activity: { river: { name: 'Zambezi' } } })
      const b = buildCatch({ activity: { river: { name: 'Amazon' } } })

      const smallCatchesApi = new SmallCatchesApi()
      expect(smallCatchesApi.sort(a, b)).toBe(1)
    })

    it('returns 0 when all compared fields are equal', () => {
      const a = buildCatch()
      const b = buildCatch()

      const smallCatchesApi = new SmallCatchesApi()
      expect(smallCatchesApi.sort(a, b)).toBe(0)
    })
  })
})
