const mockGetById = jest.fn()
const mockListRivers = jest.fn()
const mockActivitiesGetById = jest.fn()

const { ActivitiesHandler } = require('../../src/handlers/activities')
const { isAllowedParam, testLocked } = require('../../src/handlers/common')
const { getMockH } = require('../test-utils/server-test-utils')
const { Error: ResponseError, status: ResponseStatus } = require('../../src/handlers/response-error')
const SubmissionsApi = require('../../src/api/submissions')
const RiversApi = require('../../src/api/rivers')
const ActivitiesApi = require('../../src/api/activities')

jest.mock('../../src/handlers/common', () => ({
  isAllowedParam: jest.fn(),
  testLocked: jest.fn()
}))
jest.mock('./../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getById: mockGetById
    }
  })
})
jest.mock('../../src/api/rivers', () => {
  return jest.fn().mockImplementation(() => {
    return {
      list: mockListRivers,
      sort: (a, b) => a.id.localeCompare(b.id)
    }
  })
})
jest.mock('../../src/api/activities', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getFromLink: mockActivitiesGetById
    }
  })
})

const handler = new ActivitiesHandler()

describe('activities.unit', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  const getMockRequest = () => ({
    path: '/activities/add',
    params: { id: 'add' },
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ submissionId: 'sub-1' }),
      set: jest.fn()
    }))
  })

  const getMockSubmission = () => ({ id: 1, _links: { activities: { href: '/activities/1' } } })
  const getMockRivers = () => ([
    { id: 'river-1', internal: false },
    { id: 'river-2', internal: false }
  ])
  const getMockActivities = () => ([{
    id: '1',
    river: { id: 'river-1' },
    daysFishedOther: 5,
    daysFishedWithMandatoryRelease: 10,
    _links: { submission: { href: '/submissions/1' } }
  }])

  describe('doGet', () => {
    it('should throw a ResponseError if id param is not present', async () => {
      isAllowedParam.mockReturnValue(false)

      await expect(handler.doGet(getMockRequest(), getMockH())).rejects.toThrow(ResponseError)
    })

    it('should return a 403 if id param is not present', async () => {
      isAllowedParam.mockReturnValue(false)

      await expect(handler.doGet(getMockRequest(), getMockH())).rejects.toMatchObject({
        message: 'Unknown activity',
        statusCode: ResponseStatus.UNAUTHORIZED
      })
    })

    it('should redirect to review if submission is locked', async () => {
      mockGetById.mockResolvedValueOnce(getMockSubmission())
      mockListRivers.mockResolvedValueOnce(getMockRivers())
      isAllowedParam.mockReturnValueOnce(true)
      testLocked.mockResolvedValueOnce(true)
      const h = getMockH()

      await handler.doGet(getMockRequest(), h)

      expect(h.redirect).toHaveBeenCalledWith('/review')
    })

    it('should return maxDaysFished as 167, if the year is a non leap year', async () => {
      mockGetById.mockResolvedValueOnce({ id: 1, season: 2025, _links: { activities: { href: '/activities/1' } } })
      mockListRivers.mockResolvedValueOnce(getMockRivers())
      mockActivitiesGetById.mockResolvedValueOnce(getMockActivities())
      isAllowedParam.mockReturnValueOnce(true)
      testLocked.mockResolvedValueOnce(false)
      const h = getMockH()

      await handler.doGet(getMockRequest(), h)

      expect(h.view).toHaveBeenCalledWith(undefined, expect.objectContaining({
        details: {
          maxDaysFished: 167
        }
      }))
    })

    it('should return maxDaysFished as 168, if the year is a leap year', async () => {
      mockGetById.mockResolvedValueOnce({ id: 1, season: 2024, _links: { activities: { href: '/activities/1' } } })
      mockListRivers.mockResolvedValueOnce(getMockRivers())
      mockActivitiesGetById.mockResolvedValueOnce(getMockActivities())
      isAllowedParam.mockReturnValueOnce(true)
      testLocked.mockResolvedValueOnce(false)
      const h = getMockH()

      await handler.doGet(getMockRequest(), h)

      expect(h.view).toHaveBeenCalledWith(undefined, expect.objectContaining({
        details: {
          maxDaysFished: 168
        }
      }))
    })
  })
})
