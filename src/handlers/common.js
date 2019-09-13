'use strict'

const Moment = require('moment')
const months = [...Array(12).keys()].map(m => {
  const mth = Moment({ month: m }).format('MMMM')
  return {
    num: m + 1,
    key: mth.toUpperCase(),
    text: mth
  }
})

/**
 * Common and utility functions
 */
module.exports = {
  printWeight: (c) => {
    if (c.mass.type === 'IMPERIAL') {
      let lbs = Math.floor(c.mass.oz / 16).toString()
      let oz = Math.round(c.mass.oz % 16)
      if (oz === 16) {
        ++lbs
        oz = 0
      }
      return lbs + 'lbs ' + oz + 'oz'
    } else {
      return (Math.round(c.mass.kg * 1000) / 1000).toString() + 'kg'
    }
  },

  testLocked: async (request, cache, submission) => {
    if (!submission) {
      await request.cache().drop()
      request.cookieAuth.clear()
      return false
    }

    if (submission.status === 'SUBMITTED') {
      cache.submissionId = submission.id
      cache.locked = true
      await request.cache().set(cache)
      return true
    }

    return false
  },

  /**
   * For example API calls use JANUARY, internally represented as 1 and displayed as January
   */
  monthHelper: {
    months,
    find: {
      numFromKey: (k) => {
        const mth = months.find(m => m.key === k)
        return mth ? mth.num : null
      },

      keyFromNum: (n) => {
        const mth = months.find(m => m.num === Number.parseInt(n))
        return mth ? mth.key : null
      },

      textFromNum: (n) => {
        const mth = months.find(m => m.num === Number.parseInt(n))
        return mth ? mth.text : null
      }
    }
  },

  isAllowedParam: (param) => {
    return !isNaN(param) || param === 'add'
  }
}
