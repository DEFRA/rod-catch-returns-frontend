const mockGetById = jest.fn()

const LookupHandler = require('../../src/handlers/lookup')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetById
  }))
})

describe('save-handler.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getMockRequest = (query = {}, cacheObj = {}) => ({
    query,
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValueOnce(cacheObj),
      set: jest.fn().mockResolvedValueOnce()
    }))
  })

  const getMockSubmission = (overrides) => ({
    contactId: 'c1',
    season: '2025',
    ...overrides
  })

  describe('doGet', () => {
    it('should throw ResponseError if submission not found', async () => {
      const request = getMockRequest({ submissionId: 'submissions/1' })
      const h = getMockH()
      mockGetById.mockResolvedValueOnce(null)
      const handler = new LookupHandler('lookup')

      await expect(handler.doGet(request, h)).rejects.toThrow('Bad submission request')
    })

    it('should get the submission by id with the correct parameters', async () => {
      const cacheObj = {}
      const request = getMockRequest({ submissionId: 'submissions/1', activityId: '/activity/123' }, cacheObj)
      const h = getMockH()
      mockGetById.mockResolvedValueOnce(getMockSubmission())
      const handler = new LookupHandler('lookup')

      await handler.doGet(request, h)

      expect(mockGetById).toHaveBeenCalledWith(request, 'submissions/1')
    })

    it('should update cache', async () => {
      const cacheObj = {}
      const request = getMockRequest({ submissionId: 'submissions/1', activityId: '/activity/123' }, cacheObj)
      const h = getMockH()
      mockGetById.mockResolvedValueOnce(getMockSubmission())
      const handler = new LookupHandler('lookup')

      await handler.doGet(request, h)

      expect(cacheObj).toEqual({
        contactId: 'c1',
        year: '2025',
        submissionId: 'submissions/1',
        back: '/summary'
      })
    })

    it('should redirect to the activity if present', async () => {
      const cacheObj = {}
      const request = getMockRequest({ submissionId: 'submissions/1', activityId: '/activity/123' }, cacheObj)
      const h = getMockH()
      mockGetById.mockResolvedValueOnce(getMockSubmission())
      const handler = new LookupHandler('lookup')

      await handler.doGet(request, h)

      expect(cacheObj).toEqual({
        contactId: 'c1',
        year: '2025',
        submissionId: 'submissions/1',
        back: '/summary'
      })
      expect(h.redirect).toHaveBeenCalledWith('/activity/123')
    })

    it('should redirect to the small catch if present', async () => {
      const cacheObj = {}
      const request = getMockRequest({ submissionId: 'submissions/1', smallCatchId: 'small-catches/2' }, cacheObj)
      const h = getMockH()
      mockGetById.mockResolvedValueOnce(getMockSubmission())
      const handler = new LookupHandler('lookup')

      await handler.doGet(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/small-catches/2')
    })

    it('should redirect to the catch if present', async () => {
      const cacheObj = {}
      const request = getMockRequest({ submissionId: 'submissions/1', catchId: 'catches/3' }, cacheObj)
      const h = getMockH()
      mockGetById.mockResolvedValueOnce(getMockSubmission())
      const handler = new LookupHandler('lookup')

      await handler.doGet(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/catches/3')
    })

    it('should redirect to summary if no specific id provided', async () => {
      const cacheObj = {}
      const request = getMockRequest({ submissionId: 'submissions/1' }, cacheObj)
      const h = getMockH()
      mockGetById.mockResolvedValueOnce(getMockSubmission())
      const handler = new LookupHandler('lookup')

      await handler.doGet(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/summary')
    })
  })
})
