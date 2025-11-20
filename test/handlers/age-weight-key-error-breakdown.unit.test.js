const AgeWeightKeyErrorBreakdownHandler = require('../../src/handlers/age-weight-key-error-breakdown')
const { getMockH } = require('../test-utils/server-test-utils')

describe('age-weight-key-error-breakdown', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  describe('builder', () => {
    it.each([
      [{
        errorType: 'FILE_EMPTY'
      }, {
        type: 'File empty',
        message: 'The selected file is empty'
      }],
      [{
        errorType: 'MISSING_WEIGHT_HEADER',
        col: 1
      }, {
        type: 'Missing required',
        message: 'Row 1, Column 1 - File is missing the \'Weight\' column header. Column headers \'Weight\' and at least one month of the year must exist (for example: Weight, April)'
      }],
      [{
        errorType: 'MISSING_MONTH_HEADER',
        col: 1
      }, {
        type: 'Missing required',
        message: 'Row 1, Column 1 - File is missing the month column header. Column headers \'Weight\' and at least one month of the year must exist (for example: Weight, April)'
      }],
      [{
        errorType: 'COLUMN_DISALLOWED',
        col: 1
      }, {
        type: 'Column disallowed',
        message: 'Row 1, Column 1 - Column header not allowed. Column headers can only be \'Weight\' or a month of the year (for example: July)'
      }],
      [{
        errorType: 'DUPLICATE_HEADERS',
        col: 1
      }, {
        type: 'Duplicate header',
        message: 'Row 1, Column 1 - File contains a duplicate column header. Remove or change the duplicate header'
      }],
      [{
        errorType: 'ROW_HEADER_DISCREPANCY',
        row: 1
      }, {
        type: 'Row header discrepancy',
        message: 'Row 1, Column UNKNOWN - Row contains too many or too few columns compared to the number of column headers'
      }],
      [{
        errorType: 'DUPLICATE_WEIGHT',
        row: 1
      }, {
        type: 'Duplicate weight',

        message: 'Row 1, Column WEIGHT - File contains a duplicate weight. Remove or change the duplicate weight'
      }],
      [{
        errorType: 'NOT_WHOLE_NUMBER',
        row: 1
      }, {
        type: 'Not whole number',
        message: 'Row 1, Column WEIGHT - Weight must be a whole number. Change weight to a whole number'
      }],
      [{
        errorType: 'INVALID_PROBABILITY',
        row: 1,
        col: 2
      }, {
        type: 'Invalid probability',

        message: 'Row 1, Column 2 - Probability must be a number between 0 and 1 (inclusive). Change probability to a number between 0 and 1 (inclusive)'
      }]
    ])('should the input be %s the response should be %s', (error, response) => {
      const result = AgeWeightKeyErrorBreakdownHandler.builder(error)

      expect(result).toStrictEqual(response)
    })
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
    it('should call clearCacheErrors with request', async () => {
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
})
