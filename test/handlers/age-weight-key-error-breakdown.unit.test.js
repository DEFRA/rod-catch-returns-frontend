const AgeWeightKeyErrorBreakdownHandler = require('../../src/handlers/age-weight-key-error-breakdown')

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
})
