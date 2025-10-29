'use strict'

const Fs = require('fs')
const TEMP = require('../../defaults').TEMP
const logger = require('../lib/logger-utils')

module.exports = {
  /**
   * Create the temporary directory if it does not exist
   */
  checkTempDir: async (temp = TEMP) => {
    return new Promise((resolve, reject) => {
      Fs.mkdir(temp, { mode: 0o777 }, (err) => {
        if (err) {
          if (err.code === 'EEXIST') {
            logger.info(`Using temporary file directory: ${temp}`)
            resolve()
          } else {
            logger.error(err)
            reject(err)
          }
        } else {
          logger.info(`Created temporary file directory: ${temp}`)
          resolve()
        }
      })
    })
  }
}
