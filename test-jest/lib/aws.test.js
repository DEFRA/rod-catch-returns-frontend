const mockS3 = {
  upload: jest.fn().mockReturnThis(),
  promise: jest.fn(),
  headBucket: jest.fn(),
  listObjectsV2: jest.fn()
}

const { logger } = require('defra-logging-facade')

const aws = require('../../src/lib/aws')

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => mockS3),
    config: {
      update: jest.fn()
    }
  }
})
jest.mock('defra-logging-facade')

describe('aws', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('reportLocationExists', () => {
    it('should resolve if the specified bucket exists', async () => {
      mockS3.headBucket = jest.fn((params, callback) => callback())
      await expect(aws.reportLocationExists()).resolves.toBe('test')
    })

    it('should reject if the specified bucket does not exist', async () => {
      mockS3.headBucket = jest.fn((params, callback) => callback(new Error('error')))
      await expect(aws.reportLocationExists()).rejects.toThrow()
      expect(logger.error).toHaveBeenCalledTimes(1)
    })
  })

  describe('listReports', () => {
    it('should reject if it cannot retrieve the report listing', async () => {
      mockS3.listObjectsV2 = jest.fn((params, callback) => callback(new Error('error')))
      await expect(aws.listReports()).rejects.toThrow()
      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    it('should resolve and return empty array if an empty array is returned from listObjectsV2', async () => {
      mockS3.listObjectsV2 = jest.fn((params, callback) => callback(undefined, { Contents: [] }))
      await expect(aws.listReports()).resolves.toEqual([])
    })
  })
})
