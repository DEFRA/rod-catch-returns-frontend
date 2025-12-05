const ReportsHandler = require('../../src/handlers/report-download')
const { getMockH } = require('../test-utils/server-test-utils')

const mockGetReport = jest.fn()

jest.mock('../../src/lib/aws', () => ({
  getReport: (...args) => mockGetReport(...args)
}))

describe('reports-handler.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getMockStream = () => ({
    Body: 'file-content',
    ContentType: 'text/csv',
    ContentLength: 123,
    ETag: '"etag123"',
    LastModified: 'Mon, 01 Dec 2025 12:00:00 GMT'
  })

  const getMockRequest = () => ({
    params: { file: 'report.csv' }
  })

  describe('doGet', () => {
    it('should fetch report', async () => {
      const h = getMockH({
        response: jest.fn().mockReturnValue({
          header: jest.fn().mockReturnThis()
        })
      })
      mockGetReport.mockResolvedValueOnce(getMockStream())
      const handler = new ReportsHandler('reports')

      await handler.doGet(getMockRequest(), h)

      expect(mockGetReport).toHaveBeenCalledWith(
        process.env.REPORTS_S3_LOCATION_FOLDER + '/report.csv'
      )
    })

    it('should return response with correct headers', async () => {
      const mockResponse = {
        header: jest.fn().mockReturnThis()
      }
      const h = getMockH({
        response: jest.fn().mockReturnValue(mockResponse)
      })
      mockGetReport.mockResolvedValueOnce(getMockStream())
      const handler = new ReportsHandler('reports')

      await handler.doGet(getMockRequest(), h)

      expect(mockResponse.header).toHaveBeenCalledWith('Content-type', 'text/csv')
      expect(mockResponse.header).toHaveBeenCalledWith('Content-length', 123)
      expect(mockResponse.header).toHaveBeenCalledWith('content-disposition', 'attachment; filename=report.csv')
      expect(mockResponse.header).toHaveBeenCalledWith('ETag', '"etag123"')
      expect(mockResponse.header).toHaveBeenCalledWith('Last-Modified', 'Mon, 01 Dec 2025 12:00:00 GMT')
    })
  })
})
