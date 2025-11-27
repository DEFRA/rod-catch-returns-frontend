const mockGetByIdSmallCatch = jest.fn()
const mockDoMap = jest.fn()
const mockDeleteById = jest.fn()
const mockGetByIdSubmission = jest.fn()
const mockGetFromLink = jest.fn()
const mockIsAllowedParam = jest.fn()
const mockTestLocked = jest.fn()
const mockTextFromNum = jest.fn()

const DeleteSmallCatchHandler = require('../../src/handlers/delete-small-catch')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/small-catches', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetByIdSmallCatch,
    doMap: mockDoMap,
    deleteById: mockDeleteById
  }))
})

jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetByIdSubmission
  }))
})

jest.mock('../../src/api/activities', () => {
  return jest.fn().mockImplementation(() => ({
    getFromLink: mockGetFromLink
  }))
})

jest.mock('../../src/handlers/common', () => ({
  testLocked: mockTestLocked,
  isAllowedParam: mockIsAllowedParam,
  monthHelper: {
    find: {
      textFromNum: mockTextFromNum
    }
  }
}))

describe('delete-small-catch-handler.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getMockRequest = (overrides) => ({
    params: { id: '123' },
    path: '/delete-small-catch',
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValueOnce({
        submissionId: 'sub1',
        licenceNumber: 'LN123',
        postcode: 'AB12CD',
        year: '2025'
      }),
      set: jest.fn().mockResolvedValueOnce()
    })),
    ...overrides
  })

  describe('doGet', () => {
    it('should throw ResponseError if id param is not allowed', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(false)
      const handler = new DeleteSmallCatchHandler('delete-small-catch')

      await expect(handler.doGet(request, h)).rejects.toThrow('Unknown activity')
    })

    it('should throw ResponseError if smallCatch is not found', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetByIdSmallCatch.mockResolvedValueOnce(null)
      const handler = new DeleteSmallCatchHandler('delete-small-catch')

      await expect(handler.doGet(request, h)).rejects.toThrow('Unauthorized access to small catch')
    })

    it('should throw ResponseError if activityEntity not in activities', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetByIdSmallCatch.mockResolvedValueOnce({ _links: { activityEntity: { href: 'bad-link' } }, id: 'c1' })
      mockGetByIdSubmission.mockResolvedValueOnce({ _links: { activities: { href: 'activities-link' } } })
      mockGetFromLink.mockResolvedValueOnce([{ _links: { self: { href: 'other-link' } } }])
      const handler = new DeleteSmallCatchHandler('delete-small-catch')

      await expect(handler.doGet(request, h)).rejects.toThrow('Unauthorized access to small catch')
    })

    it('should redirect to review if testLocked returns true', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetByIdSmallCatch.mockResolvedValueOnce({ _links: { activityEntity: { href: 'good-link' } }, id: 'c1' })
      mockGetByIdSubmission.mockResolvedValueOnce({ _links: { activities: { href: 'activities-link' } } })
      mockGetFromLink.mockResolvedValueOnce([{ _links: { self: { href: 'good-link' } } }])
      mockTestLocked.mockResolvedValueOnce(true)
      const handler = new DeleteSmallCatchHandler('delete-small-catch')

      await handler.doGet(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/review')
    })

    it('should render view with mapped catch when all checks pass', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      const smallCatch = { _links: { activityEntity: { href: 'good-link' } }, id: 'c1' }
      mockGetByIdSmallCatch.mockResolvedValueOnce(smallCatch)
      mockGetByIdSubmission.mockResolvedValueOnce({ _links: { activities: { href: 'activities-link' } } })
      mockGetFromLink.mockResolvedValueOnce([{ _links: { self: { href: 'good-link' } } }])
      mockTestLocked.mockResolvedValueOnce(false)
      mockDoMap.mockResolvedValueOnce({ month: 5 })
      mockTextFromNum.mockReturnValueOnce('May')
      const handler = new DeleteSmallCatchHandler('delete-small-catch')

      await handler.doGet(request, h)

      expect(mockDoMap).toHaveBeenCalledWith(request, smallCatch)
      expect(mockTextFromNum).toHaveBeenCalledWith(5)
      expect(h.view).toHaveBeenCalledWith(
        'delete-small-catch',
        {
          smallCatch: { month: 'May' },
          details: {
            licenceNumber: 'LN123',
            postcode: 'AB12CD',
            year: '2025'
          }
        }
      )
    })
  })

  describe('doPost', () => {
    it('should delete catch by id', async () => {
      const request = getMockRequest()
      const h = getMockH()
      const cacheObj = { delete: 'c1' }
      request.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValueOnce(cacheObj),
        set: jest.fn().mockResolvedValueOnce()
      }))
      const handler = new DeleteSmallCatchHandler('delete-small-catch')

      await handler.doPost(request, h)

      expect(mockDeleteById).toHaveBeenCalledWith(request, 'c1')
    })

    it('should redirect to summary', async () => {
      const request = getMockRequest()
      const h = getMockH()
      const cacheObj = { delete: 'c1' }
      request.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValueOnce(cacheObj),
        set: jest.fn().mockResolvedValueOnce()
      }))
      const handler = new DeleteSmallCatchHandler('delete-small-catch')

      await handler.doPost(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/summary')
    })
  })
})
