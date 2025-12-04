const mockGetByContactIdAndYear = jest.fn()
const mockAddSubmission = jest.fn()
const mockGetFromLink = jest.fn()
const mockTestLocked = jest.fn()

const DidYouFishHandler = require('../../src/handlers/did-you-fish')
const BaseHandler = require('../../src/handlers/base')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getByContactIdAndYear: mockGetByContactIdAndYear,
    add: mockAddSubmission
  }))
})

jest.mock('../../src/api/activities', () => {
  return jest.fn().mockImplementation(() => ({
    getFromLink: mockGetFromLink
  }))
})

jest.mock('../../src/handlers/common', () => ({
  testLocked: mockTestLocked
}))

jest.mock('../../src/lib/logger-utils', () => ({
  debug: jest.fn()
}))

describe('did-you-fish-handler.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getMockRequest = (cacheObj = {}) => ({
    path: '/did-you-fish',
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValueOnce(cacheObj),
      set: jest.fn().mockResolvedValueOnce()
    })),
    payload: {}
  })

  const getMockSubmission = () => ({
    id: 'submissions/1',
    _links: {
      activities: {
        href: 'http://localhost:5000/api/activities/3'
      }
    }
  })

  describe('doGet', () => {
    it('should add a new submission if none exists', async () => {
      const cacheObj = { contactId: 'c1', year: '2025' }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      mockGetByContactIdAndYear.mockResolvedValueOnce(null)
      mockAddSubmission.mockResolvedValueOnce(getMockSubmission())
      mockGetFromLink.mockResolvedValueOnce([])
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn()
      const handler = new DidYouFishHandler('did-you-fish')

      await handler.doGet(request, h)

      expect(mockAddSubmission).toHaveBeenCalledWith(request, 'c1', '2025')
    })

    it('should redirect to review if submission is locked', async () => {
      const cacheObj = { contactId: 'c1', year: '2025' }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      mockGetByContactIdAndYear.mockResolvedValueOnce(getMockSubmission())
      mockTestLocked.mockResolvedValueOnce(true)
      const handler = new DidYouFishHandler('did-you-fish')

      const result = await handler.doGet(request, h)

      expect(result).toEqual(h.redirect('/review'))
    })

    it('should redirect to summary if activities exist', async () => {
      const cacheObj = { contactId: 'c1', year: '2025' }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      mockGetByContactIdAndYear.mockResolvedValueOnce(getMockSubmission())
      mockTestLocked.mockResolvedValueOnce(false)
      mockGetFromLink.mockResolvedValueOnce([{ id: 'activities/3' }])
      const handler = new DidYouFishHandler('did-you-fish')

      const result = await handler.doGet(request, h)

      expect(result).toEqual(h.redirect('/summary'))
    })

    it('should display view if no activities exist', async () => {
      const cacheObj = { contactId: 'c1', year: '2025', licenceNumber: 'LIC123', postcode: 'AB12CD' }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      mockGetByContactIdAndYear.mockResolvedValueOnce(getMockSubmission())
      mockTestLocked.mockResolvedValueOnce(false)
      mockGetFromLink.mockResolvedValueOnce([])
      const handler = new DidYouFishHandler('did-you-fish')

      BaseHandler.prototype.readCacheAndDisplayView = jest.fn()

      await handler.doGet(request, h)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
        request,
        h,
        {
          details: {
            licenceNumber: 'LIC123',
            postcode: 'AB12CD',
            year: '2025'
          }
        }
      )
    })
  })

  describe('doPost', () => {
    it('should redirect to review when dyf=NO and no errors', async () => {
      const request = {
        payload: {
          dyf: 'NO'
        }
      }
      const h = getMockH()
      const handler = new DidYouFishHandler('did-you-fish')

      await handler.doPost(request, h, null)

      expect(h.redirect).toHaveBeenCalledWith('/review')
    })

    it('should redirect to summary when dyf!=NO and no errors', async () => {
      const request = {
        payload: {
          dyf: 'YES'
        }
      }
      const h = getMockH()
      const handler = new DidYouFishHandler('did-you-fish')

      await handler.doPost(request, h, null)

      expect(h.redirect).toHaveBeenCalledWith('/summary')
    })

    it('should call writeCacheAndRedirect when there are errors', async () => {
      const request = {}
      const h = getMockH()
      const handler = new DidYouFishHandler('did-you-fish')
      const errors = [{ field: 'dyf', message: 'invalid' }]
      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('written')

      await handler.doPost(request, h, errors)

      expect(BaseHandler.prototype.writeCacheAndRedirect).toHaveBeenCalledWith(
        request,
        h,
        errors,
        '/summary',
        'did-you-fish'
      )
    })
  })
})
