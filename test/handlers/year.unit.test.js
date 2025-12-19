const moment = require('moment')
const YearHandler = require('../../src/handlers/year')
const BaseHandler = require('../../src/handlers/base')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('moment')

describe('year-handler.unit', () => {
  const OLD_ENV = process.env
  const OLD_ARGV = process.argv

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    process.argv = [...OLD_ARGV]
    process.env.NODE_ENV = ''
  })

  const getMockRequest = (cacheObj = {}, payload = {}) => {
    const cacheGet = jest.fn().mockResolvedValueOnce(cacheObj)
    const cacheSet = jest.fn().mockResolvedValueOnce()

    return {
      payload,
      cache: jest.fn(() => ({
        get: cacheGet,
        set: cacheSet
      }))
    }
  }

  describe('doGet', () => {
    it('should display year selection when month is Jan, Feb or Mar', async () => {
      moment.mockReturnValueOnce({
        month: () => 0,
        year: () => 2025
      })
      const handler = new YearHandler('select-year')
      const request = getMockRequest({
        licenceNumber: 'AAA-111',
        postcode: 'AA11 1AA'
      })
      const h = getMockH()
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

      await handler.doGet(request, h)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
        request,
        h,
        {
          years: [
            { value: 2024, text: '2024' },
            { value: 2025, text: '2025' }
          ],
          details: {
            licenceNumber: 'AAA-111',
            postcode: 'AA11 1AA'
          }
        }
      )
    })

    it('should display year selection when --force-year-choose is present', async () => {
      process.argv.push('--force-year-choose')
      moment.mockReturnValueOnce({
        month: () => 6,
        year: () => 2025
      })
      const handler = new YearHandler('select-year')
      const request = getMockRequest({
        licenceNumber: 'AAA-111',
        postcode: 'AA11 1AA'
      })
      const h = getMockH()
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

      await handler.doGet(request, h)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
        request,
        h,
        {
          years: [
            { value: 2024, text: '2024' },
            { value: 2025, text: '2025' }
          ],
          details: {
            licenceNumber: 'AAA-111',
            postcode: 'AA11 1AA'
          }
        })
    })

    it('should display year selection when NODE_ENV=test', async () => {
      process.env.NODE_ENV = 'test'
      moment.mockReturnValueOnce({
        month: () => 6,
        year: () => 2025
      })
      const handler = new YearHandler('select-year')
      const request = getMockRequest({
        licenceNumber: 'AAA-111',
        postcode: 'AA11 1AA'
      })
      const h = getMockH()

      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')

      await handler.doGet(request, h)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
        request,
        h,
        {
          years: [
            { value: 2024, text: '2024' },
            { value: 2025, text: '2025' }
          ],
          details: {
            licenceNumber: 'AAA-111',
            postcode: 'AA11 1AA'
          }
        })
    })

    it('should auto-set year when outside selection window', async () => {
      const expectedYear = 2025
      moment.mockReturnValueOnce({
        month: () => 6,
        year: () => expectedYear
      })
      const cacheSet = jest.fn().mockResolvedValueOnce()
      const request = {
        payload: {},
        cache: jest.fn(() => ({
          get: jest.fn().mockResolvedValueOnce({}),
          set: cacheSet
        }))
      }
      const h = getMockH()
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')
      const handler = new YearHandler('select-year')

      await handler.doGet(request, h)

      expect(cacheSet).toHaveBeenCalledWith({
        year: expectedYear
      })
    })

    it('should redirect to did-you-fish when outside selection window', async () => {
      moment.mockReturnValueOnce({
        month: () => 6,
        year: () => 2025
      })
      const request = {
        payload: {},
        cache: jest.fn(() => ({
          get: jest.fn().mockResolvedValueOnce({}),
          set: jest.fn().mockResolvedValueOnce()
        }))
      }
      const h = getMockH()
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')
      const handler = new YearHandler('select-year')

      await handler.doGet(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/did-you-fish')
    })
  })

  describe('doPost', () => {
    it('should save year to cache when no errors', async () => {
      const handler = new YearHandler('select-year')
      const cacheSet = jest.fn().mockResolvedValueOnce()
      const request = {
        payload: { year: 2025 },
        cache: jest.fn(() => ({
          get: jest.fn().mockResolvedValueOnce({}),
          set: cacheSet
        }))
      }
      const h = getMockH()

      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')

      await handler.doPost(request, h, null)

      expect(cacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          year: '2025'
        })
      )
    })

    it('should not save year when errors are present', async () => {
      const handler = new YearHandler('select-year')
      const cacheSet = jest.fn().mockResolvedValueOnce()
      const request = {
        payload: { year: 2025 },
        cache: jest.fn(() => ({
          get: jest.fn().mockResolvedValueOnce({}),
          set: cacheSet
        }))
      }
      const h = getMockH()

      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')

      await handler.doPost(request, h, ['error'])

      expect(cacheSet).not.toHaveBeenCalled()
    })

    it('should redirect to did-you-fish after post', async () => {
      const handler = new YearHandler('select-year')
      const request = getMockRequest({}, { year: 2025 })
      const h = getMockH()
      BaseHandler.prototype.writeCacheAndRedirect = jest.fn().mockReturnValueOnce('redirect-result')

      await handler.doPost(request, h, null)

      expect(BaseHandler.prototype.writeCacheAndRedirect).toHaveBeenCalledWith(
        request,
        h,
        null,
        '/did-you-fish',
        '/select-year'
      )
    })
  })
})
