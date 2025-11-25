const mockGetById = jest.fn()
const mockGetFromLink = jest.fn()
const mockGetSubmissionFromLink = jest.fn()
const mockDeleteById = jest.fn()
const mockTestLocked = jest.fn()

const DeleteActivityHandler = require('../../src/handlers/delete-activity')
const { getMockH } = require('../test-utils/server-test-utils')
const { isAllowedParam } = require('../../src/handlers/common')

jest.mock('../../src/api/activities', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetById,
    deleteById: mockDeleteById
  }))
})
jest.mock('../../src/api/rivers', () => {
  return jest.fn().mockImplementation(() => ({
    getFromLink: mockGetFromLink
  }))
})
jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getFromLink: mockGetSubmissionFromLink
  }))
})
jest.mock('../../src/handlers/common', () => ({
  testLocked: mockTestLocked,
  isAllowedParam: jest.fn()
}))

const getMockRequest = (overrides = {}) => ({
  params: { id: '123' },
  path: '/delete-activity',
  cache: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ submissionId: 'submission-123', licenceNumber: 'ABC123', postcode: 'AB12 3CD', year: '2025' }),
    set: jest.fn()
  })),
  ...overrides
})

describe('DeleteActivityHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should throw if id param is not allowed', async () => {
      isAllowedParam.mockReturnValue(false)
      const handler = new DeleteActivityHandler('delete-activity')
      await expect(handler.doGet(getMockRequest(), getMockH())).rejects.toThrow('Unknown activity')
    })

    it('should throw if activity not found', async () => {
      isAllowedParam.mockReturnValue(true)
      mockGetById.mockResolvedValue(null)
      const handler = new DeleteActivityHandler('delete-activity')
      await expect(handler.doGet(getMockRequest(), getMockH())).rejects.toThrow('Unauthorized access to activity')
    })

    it('should throw if submissionId does not match cache', async () => {
      isAllowedParam.mockReturnValue(true)
      mockGetById.mockResolvedValue({ id: 'activity-123', _links: { river: { href: 'river-link' }, submission: { href: 'submission-link' } } })
      mockGetFromLink.mockResolvedValue({})
      mockGetSubmissionFromLink.mockResolvedValue({ id: 'sub2' })
      const handler = new DeleteActivityHandler('delete-activity')
      await expect(handler.doGet(getMockRequest(), getMockH())).rejects.toThrow('Unauthorized access to activity')
    })

    it('should redirect to /review if testLocked returns true', async () => {
      isAllowedParam.mockReturnValue(true)
      mockGetById.mockResolvedValue({ id: 'activity-123', _links: { river: { href: 'river-link' }, submission: { href: 'submission-link' } } })
      mockGetFromLink.mockResolvedValue({})
      mockGetSubmissionFromLink.mockResolvedValue({ id: 'submission-123' })
      mockTestLocked.mockResolvedValue(true)
      const handler = new DeleteActivityHandler('delete-activity')
      const h = getMockH()
      await handler.doGet(getMockRequest(), h)
      expect(h.redirect).toHaveBeenCalledWith('/review')
    })

    it('should set cache.delete to activity id if all checks pass', async () => {
      isAllowedParam.mockReturnValue(true)
      mockGetById.mockResolvedValue({ id: 'activity-123', _links: { river: { href: 'river-link' }, submission: { href: 'submission-link' } } })
      mockGetFromLink.mockResolvedValue({ name: 'RiverName' })
      mockGetSubmissionFromLink.mockResolvedValue({ id: 'submission-123' })
      mockTestLocked.mockResolvedValue(false)
      const handler = new DeleteActivityHandler('delete-activity')
      const h = getMockH()
      const mockCache = { submissionId: 'submission-123', licenceNumber: 'ABC123', postcode: 'AB12 3CD', year: '2025' }
      const mockRequest = getMockRequest()
      mockRequest.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockCache),
        set: jest.fn()
      }))
      await handler.doGet(mockRequest, h)
      expect(mockCache.delete).toBe('activity-123')
    })

    it('should set cache.back to /delete-activity if all checks pass', async () => {
      isAllowedParam.mockReturnValue(true)
      mockGetById.mockResolvedValue({ id: 'activity-123', _links: { river: { href: 'river-link' }, submission: { href: 'submission-link' } } })
      mockGetFromLink.mockResolvedValue({ name: 'RiverName' })
      mockGetSubmissionFromLink.mockResolvedValue({ id: 'submission-123' })
      mockTestLocked.mockResolvedValue(false)
      const handler = new DeleteActivityHandler('delete-activity')
      const h = getMockH()
      const mockCache = { submissionId: 'submission-123', licenceNumber: 'ABC123', postcode: 'AB12 3CD', year: '2025' }
      const mockRequest = getMockRequest()
      mockRequest.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockCache),
        set: jest.fn()
      }))
      await handler.doGet(mockRequest, h)
      expect(mockCache.back).toBe('/delete-activity')
    })

    it('should call h.view with correct details if all checks pass', async () => {
      isAllowedParam.mockReturnValue(true)
      mockGetById.mockResolvedValue({ id: 'activity-123', _links: { river: { href: 'river-link' }, submission: { href: 'submission-link' } } })
      mockGetFromLink.mockResolvedValue({ name: 'RiverName' })
      mockGetSubmissionFromLink.mockResolvedValue({ id: 'submission-123' })
      mockTestLocked.mockResolvedValue(false)
      const handler = new DeleteActivityHandler('delete-activity')
      const h = getMockH()
      const mockCache = { submissionId: 'submission-123', licenceNumber: 'ABC123', postcode: 'AB12 3CD', year: '2025' }
      const mockRequest = getMockRequest()
      mockRequest.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockCache),
        set: jest.fn()
      }))
      await handler.doGet(mockRequest, h)
      expect(h.view).toHaveBeenCalledWith('delete-activity', {
        river: { name: 'RiverName' },
        details: {
          licenceNumber: 'ABC123',
          postcode: 'AB12 3CD',
          year: '2025'
        }
      })
    })
  })

  describe('doPost', () => {
    it('should call deleteById with correct args', async () => {
      mockDeleteById.mockResolvedValue()
      const handler = new DeleteActivityHandler('delete-activity')
      const mockCache = { delete: 'activity-123' }
      const mockRequest = getMockRequest()
      mockRequest.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockCache),
        set: jest.fn()
      }))
      const h = getMockH()
      await handler.doPost(mockRequest, h)
      expect(mockDeleteById).toHaveBeenCalledWith(mockRequest, 'activity-123')
    })

    it('should remove delete from cache after deletion', async () => {
      mockDeleteById.mockResolvedValue()
      const handler = new DeleteActivityHandler('delete-activity')
      const mockCache = { delete: 'activity-123' }
      const mockRequest = getMockRequest()
      mockRequest.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockCache),
        set: jest.fn()
      }))
      const h = getMockH()
      await handler.doPost(mockRequest, h)
      expect(mockCache.delete).toBeUndefined()
    })

    it('should redirect to /summary after deletion', async () => {
      mockDeleteById.mockResolvedValue()
      const handler = new DeleteActivityHandler('delete-activity')
      const mockCache = { delete: 'activity-123' }
      const mockRequest = getMockRequest()
      mockRequest.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockCache),
        set: jest.fn()
      }))
      const h = getMockH()
      await handler.doPost(mockRequest, h)
      expect(h.redirect).toHaveBeenCalledWith('/summary')
    })
  })
})
