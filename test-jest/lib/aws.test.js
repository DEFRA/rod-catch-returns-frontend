const mockS3 = Object.freeze({
  headBucket: jest.fn(),
  listObjectsV2: jest.fn(),
  getObject: jest.fn(),
  getObjectTagging: jest.fn()
})
process.env.https_proxy = 'https-proxy'
const { logger } = require('defra-logging-facade')
const aws = require('../../src/lib/aws')
const s3Client = require('@aws-sdk/client-s3')
const { NodeHttpHandler } = require('@aws-sdk/node-http-handler')
const Proxy = require('proxy-agent')

jest.mock('@aws-sdk/client-s3', () => ({
  S3: jest.fn(() => mockS3)
}))
jest.mock('defra-logging-facade')
jest.mock('proxy-agent')
jest.mock('@aws-sdk/node-http-handler', () => ({
  NodeHttpHandler: jest.fn()
}))

describe('aws', () => {
  describe('setup', () => {
    it('should pass region', async () => {
      expect(s3Client.S3).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'eu-west-1'
        })
      )
    })
    it('should setup proxy if https proxy defined in env vars', async () => {
      expect(s3Client.S3).toHaveBeenCalledWith(
        expect.objectContaining({
          requestHandler: expect.any(NodeHttpHandler)
        })
      )
    })
    it('should pass an instance of Proxy as the https agent', async () => {
      expect(NodeHttpHandler).toHaveBeenCalledTimes(1)
      expect(NodeHttpHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          httpsAgent: expect.any(Proxy)
        })
      )
    })
    it('should only setup a single Proxy instance', async () => {
      expect(Proxy).toHaveBeenCalledTimes(1)
    })

    it('should use process.env.AWS_REGION env var if specified', async () => {
      jest.isolateModules(() => {
        jest.resetModules()
        const is3Client = require('@aws-sdk/client-s3')
        jest.mock('@aws-sdk/client-s3', () => ({
          S3: jest.fn(() => mockS3)
        }))
        process.env.AWS_REGION = 'any-old-where'

        require('../../src/lib/aws')

        expect(is3Client.S3).toHaveBeenCalledWith(
          expect.objectContaining({
            region: process.env.AWS_REGION
          })
        )
      })
    })

    it('should throw error if proxy spec is wrong', async () => {
      jest.isolateModules(() => {
        jest.resetModules()
        const is3Client = require('@aws-sdk/client-s3')

        jest.mock('@aws-sdk/client-s3', () => ({
          S3: jest.fn(() => mockS3)
        }))
        jest.mock('proxy-agent', () => jest.fn(() => { throw new Error('dodgy proxy') }))

        const loadAWS = () => require('../../src/lib/aws')
        expect(loadAWS).toThrow('Bad proxy specification: Error: dodgy proxy')
      })
    })

    it("shouldn't setup proxy if https proxy isn't defined in env vars", async () => {
      jest.isolateModules(() => {
        jest.resetModules()
        const is3Client = require('@aws-sdk/client-s3')

        jest.mock('@aws-sdk/client-s3', () => ({
          S3: jest.fn(() => mockS3)
        }))

        delete process.env.https_proxy
        const iaws = require('../../src/lib/aws')
        expect(is3Client.S3).not.toHaveBeenCalledWith(
          expect.objectContaining({
            requestHandler: expect.any(NodeHttpHandler)
          })
        )
      })
    })
  })

  describe('mock clearance tests', () => {
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

      it('should return all objects provided by S3', async () => {
        mockS3.listObjectsV2.mockImplementationOnce(async () => ({ Contents: [{ Key: 'Report 1' }, { Key: 'Report 2' }] }))
        mockS3.getObjectTagging.mockImplementationOnce(async () => ({ TagSet: [{ Key: 'DeScRipTion', Value: 'Sample description for Report 1' }] }))
        mockS3.getObjectTagging.mockImplementationOnce(async () => ({ TagSet: [] }))
        mockS3.getObject.mockImplementationOnce(async () => ({ ContentLength: 20597, LastModified: new Date('2023-06-15T09:29:38.487Z'), ContentType: 'application/vnd.ms-excel' }))
        mockS3.getObject.mockImplementationOnce(async () => ({ ContentLength: 12345, LastModified: new Date('2023-06-15T09:58:08.102Z'), ContentType: 'Weird format spreadsheet' }))

        const reports = await aws.listReports()

        expect(reports).toMatchSnapshot()
      })

      it('reports errors thrown by getObject', async () => {
        mockS3.listObjectsV2.mockImplementationOnce(async () => ({ Contents: [{ Key: 'Report' }] }))
        mockS3.getObjectTagging.mockImplementationOnce(async () => ({ TagSet: [] }))
        mockS3.getObject.mockImplementationOnce(async () => { throw new Error('Tricky little timeout...') })

        const listReports = () => aws.listReports()

        await expect(listReports).rejects.toThrow('Cannot retrieve report metadata: Tricky little timeout...')
      })

      it('reports errors thrown by getObjectTagging', async () => {
        mockS3.listObjectsV2.mockImplementationOnce(async () => ({ Contents: [{ Key: 'Report' }] }))
        mockS3.getObjectTagging.mockImplementationOnce(async () => { throw new Error('Abandon ship!') })

        const listReports = () => aws.listReports()

        await expect(listReports).rejects.toThrow('Cannot retrieve report description: Abandon ship!')
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
})
