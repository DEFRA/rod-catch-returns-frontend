'use strict'
/**
 * Display the age weight key error breakdown page
 */
const BaseHandler = require('./base')

module.exports = class AgeWeightKeyErrorBreakdownHandler extends BaseHandler {
  constructor (...args) {
    super(args)
  }

  /**
   * Get handler for age weight key error breakdown
   * @param request
   * @param h
   * @param user
   * @returns {type: string, message: string}
   */

  static builder (err) {
    switch (err.errorType) {
      case 'FILE_EMPTY':
        return {
          type: 'File empty',
          message: 'The selected file is empty'
        }

      case 'MISSING_WEIGHT_HEADER':
        return {
          type: 'Missing required',
          message: `Row 1, Column ${err.col} - File is missing the 'Weight' column header. ` +
            'Column headers \'Weight\' and at least one month of the year must exist (for example: Weight, April)'
        }

      case 'MISSING_MONTH_HEADER':
        return {
          type: 'Missing required',
          message: `Row 1, Column ${err.col} - File is missing the month column header. ` +
            'Column headers \'Weight\' and at least one month of the year must exist (for example: Weight, April)'
        }

      case 'COLUMN_DISALLOWED':
        return {
          type: 'Column disallowed',
          message: `Row 1, Column ${err.col} - Column header not allowed. ` +
            'Column headers can only be \'Weight\' or a month of the year (for example: July)'
        }

      case 'DUPLICATE_HEADERS':
        return {
          type: 'Duplicate header',
          message: `Row 1, Column ${err.col} - File contains a duplicate column header. ` +
            'Remove or change the duplicate header'
        }

      case 'ROW_HEADER_DISCREPANCY':
        return {
          type: 'Row header discrepancy',
          message: `Row ${err.row}, Column UNKNOWN - ` +
            'Row contains too many or too few columns compared to the number of column headers'
        }

      case 'DUPLICATE_WEIGHT':
        return {
          type: 'Duplicate weight',
          message: `Row ${err.row}, Column WEIGHT - File contains a duplicate weight. Remove or change the duplicate weight`
        }

      case 'NOT_WHOLE_NUMBER':
        return {
          type: 'Not whole number',
          message: `Row ${err.row}, Column WEIGHT - Weight must be a whole number. Change weight to a whole number`
        }

      case 'INVALID_PROBABILITY':
        return {
          type: 'Invalid probability',
          message: `Row ${err.row}, Column ${err.col} - Probability must be a number between 0 and 1 (inclusive). ` +
            'Change probability to a number between 0 and 1 (inclusive)'
        }
    }
  }

  async doGet (request, h) {
    const cacheContext = await this.getCacheContext(request)

    const errorItems = cacheContext.errors
      .sort((a, b) => ((a.row || 0) - (b.row || 0)) || ((a.col || 0) - (b.col || 0)))
      .map(AgeWeightKeyErrorBreakdownHandler.builder)
      .filter(e => !!e)

    const filename = cacheContext.payload.upload.filename

    return this.readCacheAndDisplayView(request, h, { errorItems, filename })
  }

  async doPost (request, h) {
    await this.clearCacheErrors(request)
    return h.redirect('/age-weight-key')
  }
}
