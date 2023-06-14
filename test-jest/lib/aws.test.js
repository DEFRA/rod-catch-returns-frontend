const mockS3 = Object.freeze({
  upload: jest.fn().mockReturnThis(),
  promise: jest.fn(),
  headBucket: jest.fn(),
  listObjectsV2: jest.fn(),
  getObject: jest.fn()
})

const { logger } = require('defra-logging-facade')

const aws = require('../../src/lib/aws')

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => mockS3)
  }
})
jest.mock('@aws-sdk/client-s3', () => ({
  S3: jest.fn(() => mockS3)
}))
jest.mock('defra-logging-facade')

describe('aws', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('reportLocationExists', () => {
    it('should resolve if the specified bucket exists', async () => {
      mockS3.headBucket.mockImplementationOnce(() => 'test')
      await expect(aws.reportLocationExists()).resolves.toBe('test')
    })

    it('should reject if the specified bucket does not exist', async () => {
      mockS3.headBucket.mockImplementationOnce(() => { throw new Error('error') })
      await expect(aws.reportLocationExists()).rejects.toThrow()
      expect(logger.error).toHaveBeenCalledTimes(1)
    })
  })

  describe('listReports', () => {
    it('should reject if it cannot retrieve the report listing', async () => {
      mockS3.listObjectsV2.mockImplementationOnce(async () => { throw new Error('error') })
      await expect(aws.listReports()).rejects.toThrow()
      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    it('should resolve and return empty array if an empty array is returned from listObjectsV2', async () => {
      mockS3.listObjectsV2.mockImplementationOnce(async () => ({ Contents: [] }))
      await expect(aws.listReports()).resolves.toEqual([])
    })
  })

  describe('getReport', () => {
    it('should return data from S3', async () => {
      const data = Symbol('data')
      mockS3.getObject.mockImplementationOnce(async () => data)
      await expect(aws.getReport()).resolves.toBe(data)
    })

    it('passes key to getObject', () => {
      const Key = Symbol('skeleton')
      aws.getReport(Key)
      expect(mockS3.getObject).toHaveBeenCalledWith(
        expect.objectContaining({ Key })
      )
    })

    it('uses REPORTS_S3_LOCATION_BUCKET env var as Bucket param', () => {
      const S3Bucket = 'S3 Location'
      process.env.REPORTS_S3_LOCATION_BUCKET = S3Bucket
      aws.getReport()
      expect(mockS3.getObject).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: S3Bucket })
      )
    })

    it('should throw error if getObject generates one', async () => {
      mockS3.getObject.mockImplementationOnce(async () => { throw new Error('error') })
      await expect(() => aws.getReport()).rejects.toThrow('error')
    })

    it('logs error if getObject generates one', async () => {
      mockS3.getObject.mockImplementationOnce(async () => { throw new Error('error') })
      try {
        await aws.getReport()
      } catch {}
      expect(logger.error).toHaveBeenCalledWith('Cannot retrieve report: Error: error')
    })
  })
})
