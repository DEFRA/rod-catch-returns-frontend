const AgeWeightKeyConflictCheck = require('../../src/handlers/age-weight-key-conflict-check')
const BaseHandler = require('../../src/handlers/base')
const { getMockH } = require('../test-utils/server-test-utils')
const Fs = require('fs')
const AgeWeightKeyApi = require('../../src/api/age-weight-key')

jest.mock('fs')
jest.mock('../../src/api/age-weight-key', () => ({
  postNew: jest.fn()
}))

const getMockRequest = (overrides) => ({
  query: {},
  payload: {},
  ...overrides
})

describe('age-weight-key-conflict-check.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('AgeWeightKeyConflictCheck', () => {
    describe('removeTempFile', () => {
      it('should remove the temp file', () => {
        const handler = new AgeWeightKeyConflictCheck()
        handler.removeTempFile('/tmp/file1.tmp')

        expect(Fs.unlinkSync).toHaveBeenCalledWith('/tmp/file1.tmp')
      })
    })

    describe('doGet', () => {
      it('should return gate and year in the view', async () => {
        const mockRequest = getMockRequest()
        const h = getMockH()
        BaseHandler.prototype.getCacheContext = jest.fn().mockResolvedValue({
          ageWeightKey: {
            gateName: 'Test Gate',
            year: 2025
          }
        })
        BaseHandler.prototype.readCacheAndDisplayView = jest.fn().mockResolvedValue('mock-view-response')
        const handler = new AgeWeightKeyConflictCheck('age-weight-key-conflict-check', null, 'ageWeightContext')

        await handler.doGet(mockRequest, h)

        expect(handler.readCacheAndDisplayView).toHaveBeenCalledWith(
          mockRequest,
          h,
          { gate: 'Test Gate', year: 2025 }
        )
      })
    })

    describe('doPost', () => {
      it('should redirect back to conflict check when errors exist', async () => {
        const handler = new AgeWeightKeyConflictCheck('age-weight-key-conflict-check')
        const h = getMockH()
        const request = getMockRequest({ payload: { overwrite: 'false' } })
        const cacheContext = { ageWeightKey: { gateName: 'Gate A', year: '2025' } }
        BaseHandler.prototype.getCacheContext = jest.fn().mockResolvedValue(cacheContext)
        BaseHandler.prototype.setCacheContext = jest.fn()
        const errors = [{ type: 'SOME_ERROR' }]

        await handler.doPost(request, h, errors)

        expect(h.redirect).toHaveBeenCalledWith('/age-weight-key-conflict-check')
      })

      it('should post new file, clear cache, and redirect to ok when overwrite is true', async () => {
        const handler = new AgeWeightKeyConflictCheck('age-weight-key-conflict-check')
        const h = getMockH()
        const request = getMockRequest({ payload: { overwrite: 'true' } })
        const cacheContext = {
          ageWeightKey: {
            year: '2025',
            gateId: 'g1',
            tempfile: '/tmp/file.tmp',
            filename: 'file.csv'
          }
        }
        BaseHandler.prototype.getCacheContext = jest.fn().mockResolvedValue(cacheContext)
        BaseHandler.prototype.clearCachePayload = jest.fn()
        BaseHandler.prototype.clearCacheErrors = jest.fn()

        await handler.doPost(request, h, null)

        expect(AgeWeightKeyApi.postNew).toHaveBeenCalledWith(
          request,
          '2025',
          'g1',
          '/tmp/file.tmp',
          true
        )
        expect(Fs.unlinkSync).toHaveBeenCalledWith('/tmp/file.tmp')
        expect(BaseHandler.prototype.clearCachePayload).toHaveBeenCalledWith(request)
        expect(BaseHandler.prototype.clearCacheErrors).toHaveBeenCalledWith(request)
        expect(h.redirect).toHaveBeenCalledWith('/age-weight-key-ok')
      })

      it('should post new file when overwrite is true', async () => {
        const handler = new AgeWeightKeyConflictCheck('age-weight-key-conflict-check')
        const h = getMockH()
        const request = getMockRequest({ payload: { overwrite: 'true' } })
        const cacheContext = {
          ageWeightKey: {
            year: '2025',
            gateId: 'g1',
            tempfile: '/tmp/file.tmp',
            filename: 'file.csv'
          }
        }
        BaseHandler.prototype.getCacheContext = jest.fn().mockResolvedValue(cacheContext)
        BaseHandler.prototype.clearCachePayload = jest.fn()
        BaseHandler.prototype.clearCacheErrors = jest.fn()

        await handler.doPost(request, h, null)

        expect(AgeWeightKeyApi.postNew).toHaveBeenCalledWith(
          request,
          '2025',
          'g1',
          '/tmp/file.tmp',
          true
        )
      })

      it('should redirect to ok when overwrite is true', async () => {
        const handler = new AgeWeightKeyConflictCheck('age-weight-key-conflict-check')
        const h = getMockH()
        const request = getMockRequest({ payload: { overwrite: 'true' } })
        const cacheContext = {
          ageWeightKey: {
            year: '2025',
            gateId: 'g1',
            tempfile: '/tmp/file.tmp',
            filename: 'file.csv'
          }
        }
        BaseHandler.prototype.getCacheContext = jest.fn().mockResolvedValue(cacheContext)
        BaseHandler.prototype.clearCachePayload = jest.fn()
        BaseHandler.prototype.clearCacheErrors = jest.fn()

        await handler.doPost(request, h, null)

        expect(h.redirect).toHaveBeenCalledWith('/age-weight-key-ok')
      })

      it('should redirect back to main age-weight-key page when overwrite is false', async () => {
        const handler = new AgeWeightKeyConflictCheck('age-weight-key-conflict-check')
        const h = getMockH()
        const request = getMockRequest({ payload: { overwrite: 'false' } })
        const cacheContext = { ageWeightKey: { year: '2025', gateId: 'g1' } }
        BaseHandler.prototype.getCacheContext = jest.fn().mockResolvedValue(cacheContext)

        await handler.doPost(request, h, null)

        expect(h.redirect).toHaveBeenCalledWith('/age-weight-key?clear=true')
      })
    })
  })
})
