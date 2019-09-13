'use strict'

/**
 * Common functions for validators
 */

module.exports = {
  /**
   * Create an array of error objects from the result
   * @param result
   * @returns {Array}
   */
  apiErrors: (result) => {
    const errors = []
    result.errors.forEach(e => {
      const apiErr = {}
      apiErr[e.entity] = e.message
      if (e.property) {
        apiErr.property = e.property
      }
      if (e.invalidValue) {
        apiErr.invalidValue = e.invalidValue
      }
      errors.push(apiErr)
    })
    return errors
  },

  /**
   * @Param the API entity e.g 'SmallCatch'
   * @param errorFragments
   * @returns {Function}
   * Takes a set arguments containing substrings of possible api errors
   * and returns a function to sort the API errors by those arguments in the
   * order they were supplied to the function
   */
  getSorterForApiErrors: (entity, ...errorFragments) => {
    const locate = (e) => {
      return errorFragments.findIndex((key) => e[entity].toUpperCase().includes(key.toUpperCase()))
    }

    return (a, b) => {
      const la = locate(a)
      const lb = locate(b)

      if (la < lb) {
        return -1
      }

      if (la > lb) {
        return 1
      }

      return 0
    }
  },

  /**
   * Test is integer
   * @param value
   * @returns {boolean}
   */
  isInt: (value) => {
    return !isNaN(value) &&
    // eslint-disable-next-line eqeqeq
       parseInt(Number(value)) == value &&
       !isNaN(parseInt(value, 10))
  },

  /**
   * Replaces blanks with zero.
   * Tests for not a number.
   * @param label - The label to assign to the error
   * @param num - The number to test
   * @param errors - Pushes the error onto errors
   * @returns {*} The number you first thought of
   */
  checkNumber: (label, num, errors) => {
    if (!num || !num.trim()) {
      return 0
    } else if (isNaN(num)) {
      const err = {}
      err[label] = 'NOT_A_NUMBER'
      errors.push(err)
      return num
    }
    return num
  },

  /**
   * Helper for submission to the API where with numeric fields we can only send null or a number
   * @param num
   * @returns {*}
   */
  subNumber: (num) => {
    if (!num || !num.trim()) {
      return 0
    } else if (isNaN(num)) {
      return null
    }
    return num
  }
}
