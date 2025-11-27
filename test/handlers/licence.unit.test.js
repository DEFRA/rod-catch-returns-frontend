const LicenceHandler = require('../../src/handlers/licence')
const BaseHandler = require('../../src/handlers/base')
const { getMockH } = require('../test-utils/server-test-utils')

describe('licence.unit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const getMockRequest = (cacheObj = {}, payload = {}) => ({
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValue(cacheObj)
    })),
    payload
  })

  describe('doGet', () => {
    it('should call readCacheAndDisplayView', async () => {
      const request = getMockRequest()
      const h = getMockH()
      const handler = new LicenceHandler('licence')
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn()

      await handler.doGet(request, h)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(request, h, {})
    })
  })

  describe('doPost', () => {
    it('should write contact info into cache when there are no errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: true }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      const handler = new LicenceHandler('licence')

      // payload shape expected by handler
      request.payload = {
        contact: {
          contact: { id: 'contact-123', postcode: 'AB12 3CD' },
          licenceNumber: 'LIC-456'
        }
      }

      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValue('written')

      await handler.doPost(request, h, null)

      expect(cacheObj).toStrictEqual({
        contactId: 'contact-123',
        licenceNumber: 'LIC-456',
        postcode: 'AB12 3CD'
      })
    })

    it('should call writeCacheAndRedirect when there are no errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: true }
      const payload = {
        contact: {
          contact: { id: 'contact-123', postcode: 'AB12 3CD' },
          licenceNumber: 'LIC-456'
        }
      }
      const request = getMockRequest(cacheObj, payload)
      const h = getMockH()
      const handler = new LicenceHandler('licence')
      const mockWrite = BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValue('written')

      const result = await handler.doPost(request, h, null)

      expect(mockWrite).toHaveBeenCalledWith(
        request,
        h,
        null,
        '/select-year',
        '/licence',
        cacheObj
      )
      expect(result).toBe('written')
    })

    it('should not modify cache when there are errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: true }
      const payload = {
        contact: {
          contact: { id: 'contact-123', postcode: 'AB12 3CD' },
          licenceNumber: 'LIC-456'
        }
      }
      const request = getMockRequest(cacheObj, payload)
      const h = getMockH()
      const handler = new LicenceHandler('licence')
      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValue('written')
      const errors = [{ field: 'contact', message: 'invalid' }]

      await handler.doPost(request, h, errors)

      // cache should remain unchanged
      expect(cacheObj).toStrictEqual({
        locked: true,
        submissionId: 'submissions/1'
      })
    })

    it('should call writeCacheAndRedirect when there are errors', async () => {
      const cacheObj = { submissionId: 'submissions/1', locked: true }
      const payload = {
        contact: {
          contact: { id: 'contact-123', postcode: 'AB12 3CD' },
          licenceNumber: 'LIC-456'
        }
      }
      const request = getMockRequest(cacheObj, payload)
      const h = getMockH()
      const handler = new LicenceHandler('licence')
      const mockWrite = BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValue('written')
      const errors = [{ field: 'contact', message: 'invalid' }]

      const result = await handler.doPost(request, h, errors)

      expect(mockWrite).toHaveBeenCalledWith(
        request,
        h,
        errors,
        '/select-year',
        '/licence',
        cacheObj
      )
      expect(result).toBe('written')
    })
  })
})
