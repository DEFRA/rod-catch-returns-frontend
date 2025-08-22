const mockSubmissionGetById = jest.fn()
const mockListRivers = jest.fn()
const mockActivitiesGetFromLink = jest.fn()
const mockActivitiesGetById = jest.fn()
const mockActivitiesDoMap = jest.fn()
const mockSubmissionsGetFromLink = jest.fn()

const { ActivitiesHandler } = require('../../src/handlers/activities')
const { isAllowedParam, testLocked } = require('../../src/handlers/common')
const { getMockH } = require('../test-utils/server-test-utils')
const { Error: ResponseError, status: ResponseStatus } = require('../../src/handlers/response-error')

jest.mock('../../src/handlers/common', () => ({
  isAllowedParam: jest.fn(),
  testLocked: jest.fn()
}))
jest.mock('./../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getById: mockSubmissionGetById,
      getFromLink: mockSubmissionsGetFromLink
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
      getFromLink: mockActivitiesGetFromLink,
      getById: mockActivitiesGetById,
      doMap: mockActivitiesDoMap
    }
  })
})

const handler = new ActivitiesHandler('activity')

const setupCommonFlags = ({ allowed = true, locked = false } = {}) => {
  isAllowedParam.mockReturnValue(allowed)
  testLocked.mockResolvedValue(locked)
}

const getMockAddRequest = (overrides) => ({
  path: '/activities/add',
  params: { id: 'add' },
  cache: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ submissionId: 'sub-1' }),
    set: jest.fn()
  })),
  ...overrides
})

const getMockChangeRequest = (overrides) => ({
  path: '/activities/change',
  params: { id: 'change' },
  cache: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ submissionId: 'sub-1' }),
    set: jest.fn()
  })),
  ...overrides
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

const setupApis = ({
  submissionGetById = getMockSubmission(),
  submissionsGetFromLink = getMockSubmission(),
  listRivers = getMockRivers(),
  activitiesGetFromLink = getMockActivities(),
  activitiesGetById = getMockActivities()[0],
  activitiesDoMap = getMockActivities()[0]
} = {}) => {
  mockSubmissionGetById.mockResolvedValueOnce(submissionGetById)
  mockSubmissionsGetFromLink.mockResolvedValueOnce(submissionsGetFromLink)
  mockListRivers.mockResolvedValueOnce(listRivers)
  mockActivitiesGetFromLink.mockResolvedValueOnce(activitiesGetFromLink)
  mockActivitiesGetById.mockResolvedValueOnce(activitiesGetById)
  mockActivitiesDoMap.mockResolvedValueOnce(activitiesDoMap)
}

const expectMaxDaysFished = (h, expected) => {
  expect(h.view).toHaveBeenCalledWith(
    'activity',
    expect.objectContaining({
      details: expect.objectContaining({
        maxDaysFished: expected
      })
    })
  )
}

describe('activities.unit', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  describe('ActivitiesHandler', () => {
    describe('doGet', () => {
      describe('add', () => {
        it('should throw a ResponseError if id param is not present', async () => {
          setupCommonFlags({ allowed: false })

          await expect(handler.doGet(getMockAddRequest(), getMockH())).rejects.toThrow(ResponseError)
        })

        it('should return a 403 if id param is not present', async () => {
          setupCommonFlags({ allowed: false })

          await expect(handler.doGet(getMockAddRequest(), getMockH())).rejects.toMatchObject({
            message: 'Unknown activity',
            statusCode: ResponseStatus.UNAUTHORIZED
          })
        })

        it('should redirect to review if submission is locked', async () => {
          setupApis()
          setupCommonFlags({ locked: true })
          const h = getMockH()

          await handler.doGet(getMockAddRequest(), h)

          expect(h.redirect).toHaveBeenCalledWith('/review')
        })

        it('should return maxDaysFished as 167, if the year is a non leap year', async () => {
          setupApis({ submissionGetById: { id: 1, season: 2025, _links: { activities: { href: '/activities/1' } } } })
          setupCommonFlags()
          const h = getMockH()

          await handler.doGet(getMockAddRequest(), h)

          expectMaxDaysFished(h, 167)
        })

        it('should return maxDaysFished as 168, if the year is a leap year', async () => {
          setupApis({ submissionGetById: { id: 1, season: 2024, _links: { activities: { href: '/activities/1' } } } })
          setupCommonFlags()
          const h = getMockH()

          await handler.doGet(getMockAddRequest(), h)

          expectMaxDaysFished(h, 168)
        })
      })

      describe('change', () => {
        it('should return maxDaysFished as 167, if the year is a non leap year', async () => {
          setupApis({ submissionGetById: { id: 1, season: 2025, _links: { activities: { href: '/activities/1' } } } })
          setupCommonFlags()
          const h = getMockH()

          await handler.doGet(getMockChangeRequest(), h)

          expectMaxDaysFished(h, 167)
        })

        it('should return maxDaysFished as 168, if the year is a leap year', async () => {
          setupApis({ submissionGetById: { id: 1, season: 2024, _links: { activities: { href: '/activities/1' } } } })
          setupCommonFlags()
          const h = getMockH()

          await handler.doGet(getMockChangeRequest(), h)

          expectMaxDaysFished(h, 168)
        })
      })
    })
  })
})
