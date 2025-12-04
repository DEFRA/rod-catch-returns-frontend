const mockGetById = jest.fn()
const mockSetSubmitted = jest.fn()
const mockSetIncomplete = jest.fn()
const mockDisplayData = jest.fn()

const ReviewHandler = require('../../src/handlers/review')

jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetById,
    setSubmitted: mockSetSubmitted,
    setIncomplete: mockSetIncomplete
  }))
})

jest.mock('../../src/handlers/display-data', () => mockDisplayData)

const { getMockH } = require('../test-utils/server-test-utils')

describe('review-handler.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  const getMockRequest = (cacheObj = {}, payload = {}) => ({
    path: '/review',
    payload,
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValue(cacheObj),
      set: jest.fn().mockResolvedValue()
    }))
  })

  describe('doGet / reviewReturn', () => {
    it('should set back in cache and render view with details', async () => {
      const cacheObj = {
        submissionId: 'sub-1',
        year: 2025,
        licenceNumber: 'LIC123',
        postcode: 'AB12CD',
        locked: true
      }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      const handler = new ReviewHandler('review')

      const submission = { reportingExclude: true }
      mockGetById.mockResolvedValueOnce(submission)
      mockDisplayData.mockResolvedValueOnce({
        activities: ['a1'],
        catches: ['c1'],
        smallCatches: ['s1'],
        foundInternal: true
      })

      await handler.doGet(request, h)

      expect(mockGetById).toHaveBeenCalledWith(request, 'sub-1')
      expect(mockDisplayData).toHaveBeenCalledWith(request, submission)
      expect(h.view).toHaveBeenCalledWith('review', {
        year: 2025,
        activities: ['a1'],
        catches: ['c1'],
        smallCatches: ['s1'],
        foundInternal: true,
        locked: true,
        reportingExclude: true,
        details: {
          licenceNumber: 'LIC123',
          postcode: 'AB12CD',
          year: 2025
        }
      })
    })
  })

  describe('doPost', () => {
    it('should lock and redirect to confirmation when continue is present', async () => {
      const cacheObj = { submissionId: 'sub-1', locked: false }
      const request = getMockRequest(cacheObj, { continue: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      const result = await handler.doPost(request, h)

      expect(cacheObj.locked).toBe(true)
      expect(mockSetSubmitted).toHaveBeenCalledWith(request, 'sub-1')
      expect(result).toEqual(h.redirect('/confirmation'))
    })

    it('should unlock and redirect to summary when unlock is present and CONTEXT=FMT', async () => {
      process.env.CONTEXT = 'FMT'
      const cacheObj = { submissionId: 'sub-1', locked: true }
      const request = getMockRequest(cacheObj, { unlock: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      const result = await handler.doPost(request, h)

      expect(cacheObj.locked).toBe(false)
      expect(mockSetIncomplete).toHaveBeenCalledWith(request, 'sub-1')
      expect(result).toEqual(h.redirect('/summary'))
    })

    it('should throw error when payload does not contain continue or unlock', async () => {
      const request = getMockRequest({}, { somethingElse: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await expect(handler.doPost(request, h)).rejects.toThrow('Lock operation not permitted')
    })

    it('should throw error when unlock present but CONTEXT != FMT', async () => {
      process.env.CONTEXT = 'ANGLER'
      const request = getMockRequest({}, { unlock: true })
      const h = getMockH()
      const handler = new ReviewHandler('review')

      await expect(handler.doPost(request, h)).rejects.toThrow('Lock operation not permitted')
    })
  })
})
