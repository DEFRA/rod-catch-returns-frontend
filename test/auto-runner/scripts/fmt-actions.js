'use strict'

const requests = require('./requests')
const signIn = require('./sign-in')

module.exports = signIn.fmtSubsequent
    .concat(requests.fmtSelectLicence)
    .concat(requests.fmtUnlockLicence)
    .concat(requests.fmtExclude)
    .concat(requests.fmtLookupSubmission)
    .concat(requests.fmtRecords)
