'use strict'

const requests = require('./requests')
const signIn = require('./sign-in')

module.exports = signIn.subsequent
  .concat(requests.addLargeCatch1)
  .concat(requests.addLargeCatch2)
  .concat(requests.addLargeCatch3)
  .concat(requests.addLargeCatch4)
  .concat(requests.editLargeCatch1)
  .concat(requests.editLargeCatch2)
  .concat(requests.editLargeCatch3WithErrors)
  .concat(requests.editLargeCatch4WithErrors)
  .concat(requests.deleteLargeCatch1)
  .concat(requests.deleteLargeCatch2)
  .concat(requests.deleteLargeCatch3)
  .concat(requests.deleteLargeCatch4)
  .concat(requests.addLargeCatchWithErrors1)
  .concat(requests.addLargeCatchWithErrors2)

