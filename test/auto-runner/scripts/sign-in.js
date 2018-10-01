'use strict'

const requests = require('./requests')

module.exports = {
  first: requests.start
    .concat(requests.signInFail)
    .concat(requests.signInSuccess),

  subsequent: requests.start
    .concat(requests.signInWithActivity)
}