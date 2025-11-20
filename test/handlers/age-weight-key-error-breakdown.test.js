const AgeWeightKeyErrorBreakdownHandler = require('../../src/handlers/age-weight-key-error-breakdown')
const { getMockH } = require('../test-utils/server-test-utils')

describe('age-weight-key-error-breakdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should call getCacheContext with request', async () => {
      const handler = new AgeWeightKeyErrorBreakdownHandler('age-weight-key-error-breakdown', null, 'ageWeightContext')
      const mockRequest = Symbol('mockRequest')
      const h = getMockH()
      const errors = [{ errorType: 'FILE_EMPTY' }, { errorType: 'DUPLICATE_WEIGHT', row: 2 }]
      const filename = 'test.csv'
      handler.getCacheContext = jest.fn().mockResolvedValue({
        errors,
        payload: { upload: { filename } }
      })
      handler.readCacheAndDisplayView = jest.fn().mockResolvedValue('mock-view-response')

      await handler.doGet(mockRequest, h)
      expect(handler.getCacheContext).toHaveBeenCalledWith(mockRequest)
    })

    it('should call readCacheAndDisplayView with correct args', async () => {
      const handler = new AgeWeightKeyErrorBreakdownHandler('age-weight-key-error-breakdown', null, 'ageWeightContext')
      const mockRequest = Symbol('mockRequest')
      const h = getMockH()
      const errors = [{ errorType: 'FILE_EMPTY' }, { errorType: 'DUPLICATE_WEIGHT', row: 2 }]
      const filename = 'test.csv'
      handler.getCacheContext = jest.fn().mockResolvedValue({
        errors,
        payload: { upload: { filename } }
      })
      handler.readCacheAndDisplayView = jest.fn().mockResolvedValue('mock-view-response')

      await handler.doGet(mockRequest, h)
      expect(handler.readCacheAndDisplayView).toHaveBeenCalledWith(
        mockRequest,
        h,
        {
          errorItems: [
            AgeWeightKeyErrorBreakdownHandler.builder(errors[0]),
            AgeWeightKeyErrorBreakdownHandler.builder(errors[1])
          ],
          filename
        }
      )
    })

    it('should return the view response', async () => {
      const handler = new AgeWeightKeyErrorBreakdownHandler('age-weight-key-error-breakdown', null, 'ageWeightContext')
      const mockRequest = {}
      const h = getMockH()
      const errors = [{ errorType: 'FILE_EMPTY' }, { errorType: 'DUPLICATE_WEIGHT', row: 2 }]
      const filename = 'test.csv'
      handler.getCacheContext = jest.fn().mockResolvedValue({
        errors,
        payload: { upload: { filename } }
      })
      handler.readCacheAndDisplayView = jest.fn().mockResolvedValue('mock-view-response')
      const result = await handler.doGet(mockRequest, h)
      expect(result).toBe('mock-view-response')
    })
  })

  describe('doPost', () => {
    it('should clear cache errors', async () => {
      const handler = new AgeWeightKeyErrorBreakdownHandler('age-weight-key-error-breakdown', null, 'ageWeightContext')
      const mockRequest = Symbol('mockRequest')
      const h = getMockH()
      handler.clearCacheErrors = jest.fn().mockResolvedValue()
      h.redirect = jest.fn().mockReturnValue('redirect')

      await handler.doPost(mockRequest, h)
      expect(handler.clearCacheErrors).toHaveBeenCalledWith(mockRequest)
    })

    it('should redirect to /age-weight-key', async () => {
      const handler = new AgeWeightKeyErrorBreakdownHandler('age-weight-key-error-breakdown', null, 'ageWeightContext')
      const mockRequest = {}
      const h = getMockH()
      handler.clearCacheErrors = jest.fn().mockResolvedValue()
      h.redirect = jest.fn().mockReturnValue('redirect')

      await handler.doPost(mockRequest, h)
      expect(h.redirect).toHaveBeenCalledWith('/age-weight-key')
    })

    it('should return the redirect result', async () => {
      const handler = new AgeWeightKeyErrorBreakdownHandler('age-weight-key-error-breakdown', null, 'ageWeightContext')
      const mockRequest = {}
      const h = getMockH()
      handler.clearCacheErrors = jest.fn().mockResolvedValue()
      h.redirect = jest.fn().mockReturnValue('redirect')

      const result = await handler.doPost(mockRequest, h)
      expect(result).toBe('redirect')
    })
  })

  describe('builder', () => {
    it('should map FILE_EMPTY error', () => {
      const err = { errorType: 'FILE_EMPTY' }
      const result = AgeWeightKeyErrorBreakdownHandler.builder(err)
      expect(result).toEqual({ type: 'File empty', message: 'The selected file is empty' })
    })

    it('should map DUPLICATE_WEIGHT error', () => {
      const err = { errorType: 'DUPLICATE_WEIGHT', row: 2 }
      const result = AgeWeightKeyErrorBreakdownHandler.builder(err)
      expect(result).toEqual({ type: 'Duplicate weight', message: 'Row 2, Column WEIGHT - File contains a duplicate weight. Remove or change the duplicate weight' })
    })

    it('should return undefined for unknown errorType', () => {
      const err = { errorType: 'UNKNOWN_TYPE' }
      const result = AgeWeightKeyErrorBreakdownHandler.builder(err)
      expect(result).toBeUndefined()
    })
  })
})
