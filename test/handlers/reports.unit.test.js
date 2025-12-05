const mockReportLocationExists = jest.fn()
const mockListReports = jest.fn()

const ReportsHandler = require('../../src/handlers/reports')
const BaseHandler = require('../../src/handlers/base')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/lib/aws', () => ({
  reportLocationExists: mockReportLocationExists,
  listReports: mockListReports
}))

describe('reports-handler.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getMockReports = () => ([{ name: 'report1' }, { name: 'report2' }])

  describe('doGet', () => {
    it('should check report location', async () => {
      const request = {}
      const h = getMockH()
      mockReportLocationExists.mockResolvedValueOnce()
      mockListReports.mockResolvedValueOnce(getMockReports())
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')
      const handler = new ReportsHandler('reports')

      await handler.doGet(request, h)

      expect(mockReportLocationExists).toHaveBeenCalled()
    })

    it('should list reports', async () => {
      const request = {}
      const h = getMockH()
      mockReportLocationExists.mockResolvedValueOnce()
      mockListReports.mockResolvedValueOnce(getMockReports())
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')
      const handler = new ReportsHandler('reports')

      await handler.doGet(request, h)

      expect(mockListReports).toHaveBeenCalled()
    })

    it('should return the view', async () => {
      const request = Symbol('request')
      const h = getMockH()
      mockReportLocationExists.mockResolvedValueOnce()
      const reports = getMockReports()
      mockListReports.mockResolvedValueOnce(reports)
      BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockReturnValueOnce('view-result')
      const handler = new ReportsHandler('reports')

      const result = await handler.doGet(request, h)

      expect(BaseHandler.prototype.readCacheAndDisplayView).toHaveBeenCalledWith(
        request,
        h,
        { reports }
      )
      expect(result).toBe('view-result')
    })

    it('should throw errors from aws methods', async () => {
      const request = {}
      const h = getMockH()
      const handler = new ReportsHandler('reports')

      mockReportLocationExists.mockRejectedValueOnce(new Error('location error'))

      await expect(handler.doGet(request, h)).rejects.toThrow('location error')
    })
  })
})
