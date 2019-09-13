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
   * @returns {Promise<*>}
   */

  static buildErrorItemsObject (errorsObject) {
    const errorItems = []
    const errorTypes = Object.keys(errorsObject)

    errorTypes.forEach(a => {
      const aTypes = Object.keys(errorsObject[a])
      switch (a) {
        case 'generalErrors':
          errorsObject[a].forEach(b => {
            switch (b) {
              case 'INVALID_CSV':
                errorItems.push({
                  type: 'Invalid csv',
                  message: 'File has .csv formatting issues. Check for missing commas, extra commas, or improper use of quotes.'
                })
                break

              default:
            }
          })
          break

        case 'headerErrors':
          aTypes.forEach(b => {
            switch (b) {
              case 'MISSING_REQUIRED':
                errorsObject[a][b].forEach(c => {
                  errorItems.push({
                    type: 'Missing required',
                    message: `Row 1, Column ${c} - File is missing a required column header. Column headers 'Weight' and at least one month of the year must exist (for example: Weight, April).`
                  })
                })
                break

              case 'COLUMN_DISALLOWED':
                errorsObject[a][b].forEach(c => {
                  errorItems.push({
                    type: 'Column disallowed',
                    message: `Row 1, Column ${c} - Column header not allowed. Column headers can only be 'Weight' or a month of the year (for example: July).`
                  })
                })
                break

              case 'DUPLICATE_HEADERS':
                errorsObject[a][b].forEach(c => {
                  errorItems.push({
                    type: 'Duplicate header',
                    message: `Row 1, Column ${c} - File contains a duplicate column header. Remove or change the duplicate header.`
                  })
                })
                break

              default:
            }
          })
          break

        case 'errorsByRow':
          aTypes.forEach(b => {
            switch (b) {
              case 'ROW_HEADER_DISCREPANCY':
                errorsObject[a][b].forEach(c => {
                  errorItems.push({
                    type: 'Row header discrepancy',
                    message: `Row ${c}, Column UNKNOWN - Row contains too many or too few columns compared to the number of column headers.`
                  })
                })
                break

              default:
            }
          })
          break

        case 'errorsByColumnAndRowNumber':
          aTypes.forEach(b => {
            const bTypes = Object.keys(errorsObject[a][b])
            switch (b) {
              case 'DUPLICATE':
                bTypes.forEach(c => {
                  errorsObject[a][b][c].forEach(d => {
                    errorItems.push({
                      type: 'Not whole number',
                      message: `Row ${d}, Column WEIGHT - File contains a duplicate weight. Remove or change the duplicate weight.`
                    })
                  })
                })
                break

              case 'NOT_WHOLE_NUMBER':
                bTypes.forEach(c => {
                  errorsObject[a][b][c].forEach(d => {
                    errorItems.push({
                      type: 'Not whole number',
                      message: `Row ${d}, Column WEIGHT - Weight must be a whole number. Change weight to a whole number`
                    })
                  })
                })
                break

              case 'INVALID_PROBABILITY':
                bTypes.forEach(c => {
                  errorsObject[a][b][c].forEach(d => {
                    errorItems.push({
                      type: 'Invalid probability',
                      message: `Row ${d}, Column ${c} - Probability must be a number between 0 and 1 (inclusive). Change probability to a number between 0 and 1 (inclusive).`
                    })
                  })
                })
                break

              default:
            }
          })
          break

        default:
      }
    })

    return errorItems
  }

  async doGet (request, h) {
    const cache = await request.cache().get()
    const errorsObject = cache.ageWeightContext.errors[0].message
    const errorItems = AgeWeightKeyErrorBreakdownHandler.buildErrorItemsObject(errorsObject)
    const filename = cache.ageWeightContext.payload.upload.filename

    return this.readCacheAndDisplayView(request, h, { errorItems, filename })
  }
}
