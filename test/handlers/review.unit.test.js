const mockGetById = jest.fn()
const mockDisplayData = jest.fn()
const mockSetSubmitted = jest.fn()
const mockSetIncomplete = jest.fn()

const ReviewHandler = require('../../src/handlers/review')
const BaseHandler = require('../../src/handlers/base')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions', () => jest.fn(() => ({
  getById: mockGetById,
  setSubmitted: mockSetSubmitted,
  setIncomplete: mockSetIncomplete
})))
jest.mock('../../src/handlers/display-data', () => mockDisplayData)

describe('review-handler.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  const getMockRequest = (cacheObj, payload = {}) => {
    const cache = {
      get: jest.fn().mockResolvedValue(cacheObj),
      set: jest.fn().mockResolvedValue()
    }
    return {
      path: '/review',
      payload,
      cache: jest.fn(() => cache)
    }
  }

  describe('doGet', () => {
    it('should render view with details', async () => {
      const cacheObj = {
        submissionId: 'submissions/1',
        year: 2025,
        licenceNumber: 'LIC123',
        postcode: 'AB12 CCD',
        locked: true
      }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      mockGetById.mockResolvedValueOnce({ reportingExclude: true })
      mockDisplayData.mockResolvedValueOnce({
        activities: ['a1'],
        catches: ['c1'],
        smallCatches: ['s1'],
        foundInternal: true
      })
      const handler = new ReviewHandler('review')
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn()

      await handler.doGet(request, h)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
        request,
        h,
        {
          year: 2025,
          activities: ['a1'],
          catches: ['c1'],
          smallCatches: ['s1'],
          foundInternal: true,
          hasFished: true,
          hasCatches: false,
          locked: true,
          reportingExclude: true,
          details: {
            licenceNumber: 'LIC123',
            postcode: 'AB12 CCD',
            year: 2025
          }
        }
      )
    })

    it('should persist the request path as the back link in the cache', async () => {
      const cacheObj = { submissionId: 'submissions/1', year: 2025 }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      mockGetById.mockResolvedValueOnce({})
      mockDisplayData.mockResolvedValueOnce({ activities: [], catches: [], smallCatches: [], foundInternal: false })
      const handler = new ReviewHandler('review')
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn()

      await handler.doGet(request, h)

      expect(request.cache().set).toHaveBeenCalledWith(expect.objectContaining({ back: '/review' }))
    })

    it('should get the submission using the submissionId from the cache', async () => {
      const cacheObj = { submissionId: 'submissions/1', year: 2025 }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      mockGetById.mockResolvedValueOnce({})
      mockDisplayData.mockResolvedValueOnce({ activities: [], catches: [], smallCatches: [], foundInternal: false })
      const handler = new ReviewHandler('review')
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn()

      await handler.doGet(request, h)

      expect(mockGetById).toHaveBeenCalledWith(request, 'submissions/1')
    })

    it('should get the display data using the fetched submission', async () => {
      const cacheObj = { submissionId: 'submissions/1', year: 2025 }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      const submission = { reportingExclude: true }
      mockGetById.mockResolvedValueOnce(submission)
      mockDisplayData.mockResolvedValueOnce({ activities: [], catches: [], smallCatches: [], foundInternal: false })
      const handler = new ReviewHandler('review')
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn()

      await handler.doGet(request, h)

      expect(mockDisplayData).toHaveBeenCalledWith(request, submission)
    })

    it.each([
      { activities: [], expected: { hasFished: false, hasCatches: false }, description: 'there are no activities' },
      { activities: [{ count: 0 }], expected: { hasFished: true, hasCatches: false }, description: 'there are activities but no catches' },
      { activities: [{ count: 2 }], expected: { hasFished: true, hasCatches: true }, description: 'there are activities with catches' }
    ])('should set hasFished and hasCatches correctly when $description', async ({ activities, expected }) => {
      const request = getMockRequest({ submissionId: 'submissions/1', year: 2025 })
      const h = getMockH()
      mockGetById.mockResolvedValueOnce({})
      mockDisplayData.mockResolvedValueOnce({ activities, catches: [], smallCatches: [], foundInternal: false })
      const handler = new ReviewHandler('review')
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn()

      await handler.doGet(request, h)

      const viewData = BaseHandler.prototype.readCacheAndDisplayView.mock.calls[0][2]
      expect({ hasFished: viewData.hasFished, hasCatches: viewData.hasCatches }).toEqual(expected)
    })
  })

  describe('doPost', () => {
    it('should persist the cache with locked true when continue is present and there are no errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true, confirm: 'yes' })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, null)

      expect(request.cache().set).toHaveBeenCalledWith({ submissionId: 'submissions/1', locked: true })
    })

    it('should mark the submission as submitted when continue is present and there are no errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true, confirm: 'yes' })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, null)

      expect(mockSetSubmitted).toHaveBeenCalledWith(request, 'submissions/1')
    })

    it('should redirect to confirmation when continue is present and there are no errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true, confirm: 'yes' })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, null)

      expect(h.redirect).toHaveBeenCalledWith('/confirmation')
    })

    it('should not persist locked true when continue is present but there are errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, [{ confirm: 'EMPTY' }])

      expect(request.cache().set).not.toHaveBeenCalledWith(expect.objectContaining({ locked: true }))
    })

    it('should not mark the submission as submitted when continue is present but there are errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, [{ confirm: 'EMPTY' }])

      expect(mockSetSubmitted).not.toHaveBeenCalled()
    })

    it('should cache the errors and payload when there are errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, [{ confirm: 'EMPTY' }])

      expect(request.cache().set).toHaveBeenCalledWith({
        submissionId: 'submissions/1',
        locked: false,
        defaultContext: {
          errors: [{ confirm: 'EMPTY' }],
          payload: { continue: true }
        }
      })
    })

    it('should redirect to review when there are errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, [{ confirm: 'EMPTY' }])

      expect(h.redirect).toHaveBeenCalledWith('/review')
    })

    it('should persist the cache with locked false when unlock is present and CONTEXT=FMT', async () => {
      process.env.CONTEXT = 'FMT'
      const cacheObj = { submissionId: 'submissions/1', locked: true }
      const request = getMockRequest(cacheObj, { unlock: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h)

      expect(request.cache().set).toHaveBeenCalledWith({ submissionId: 'submissions/1', locked: false })
    })

    it('should mark the submission as incomplete when unlock is present and CONTEXT=FMT', async () => {
      process.env.CONTEXT = 'FMT'
      const cacheObj = { submissionId: 'submissions/1', locked: true }
      const request = getMockRequest(cacheObj, { unlock: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h)

      expect(mockSetIncomplete).toHaveBeenCalledWith(request, 'submissions/1')
    })

    it('should redirect to summary when unlock is present and CONTEXT=FMT', async () => {
      process.env.CONTEXT = 'FMT'
      const cacheObj = { submissionId: 'submissions/1', locked: true }
      const request = getMockRequest(cacheObj, { unlock: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/summary')
    })

    it.each([
      { payload: { somethingElse: true }, description: 'payload does not contain continue or unlock' },
      { payload: { unlock: true }, description: 'unlock is present but CONTEXT is not FMT' }
    ])('should throw an error when $description', async ({ payload }) => {
      process.env.CONTEXT = 'ANGLER'
      const request = getMockRequest({}, payload)
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await expect(handler.doPost(request, h)).rejects.toThrow('Lock operation not permitted')
    })
  })
})
