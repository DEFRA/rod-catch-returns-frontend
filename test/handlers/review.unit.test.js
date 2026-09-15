const mockGetById = jest.fn()
const mockDisplayData = jest.fn()

const ReviewHandler = require('../../src/handlers/review')
const BaseHandler = require('../../src/handlers/base')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions', () => jest.fn(() => ({
  getById: mockGetById,
  setSubmitted: jest.fn(),
  setIncomplete: jest.fn()
})))
jest.mock('../../src/handlers/display-data', () => mockDisplayData)

describe('review-handler.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  const getMockRequest = (cacheObj, payload = {}) => ({
    path: '/review',
    payload,
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValueOnce(cacheObj),
      set: jest.fn().mockResolvedValueOnce()
    }))
  })

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
  })

  describe('doPost', () => {
    it('should lock when continue is present and there are no errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true, confirm: 'yes' })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, null)

      expect(cacheObj.locked).toBe(true)
    })

    it('should redirect to confirmation when continue is present and there are no errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true, confirm: 'yes' })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, null)

      expect(h.redirect).toHaveBeenCalledWith('/confirmation')
    })

    it('should not lock when continue is present but there are errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, [{ confirm: 'EMPTY' }])

      expect(cacheObj.locked).toBe(false)
    })

    it('should cache the errors and payload when there are errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h, [{ confirm: 'EMPTY' }])

      expect(cacheObj.defaultContext).toEqual({
        errors: [{ confirm: 'EMPTY' }],
        payload: { continue: true }
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

    it('should unlock when unlock is present and CONTEXT=FMT', async () => {
      process.env.CONTEXT = 'FMT'
      const cacheObj = { submissionId: 'submissions/1', locked: true }
      const request = getMockRequest(cacheObj, { unlock: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await handler.doPost(request, h)

      expect(cacheObj.locked).toBe(false)
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
