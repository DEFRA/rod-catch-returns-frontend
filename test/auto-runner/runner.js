'use strict'

const { logger } = require('defra-logging-facade')
const Code = require('code')
const expect = Code.expect
const minimalServer = require('./minimal-server')

const internals = {
  toInjectionObject: (request) => {
    const { path, method, payload } = request
    const result = {}

    result.method = method
    result.url = path

    if (payload && method === 'POST') {
      result.payload = payload
    }

    if (internals.sid) {
      result.headers = { cookie: 'sid=' + internals.sid }
    }

    return result
  },

  run: async (request) => {
    const { status, redirect } = request
    internals.counter++

    const server = await minimalServer()
    logger.debug(`Request: request (${internals.counter}) ${JSON.stringify(request, null, 4)}`)

    const response = await server.inject(internals.toInjectionObject(request))
    internals.sid = internals.getCookies(response)['sid'] || internals.sid

    let err = false
    if (response.statusCode !== status) {
      err = true
    }

    if (redirect) {
      if (response.headers.location !== redirect) {
        err = true
      }
    } else {
      if (response.headers.location) {
        err = true
      }
    }

    if (err) {
      logger.error(`Error: request (${internals.counter}) ${JSON.stringify(request, null, 4)}`)
      logger.error('Got status: ' + response.statusCode)
      if (response.headers.location) {
        logger.error('Got redirect: ' + response.headers.location)
      }
    }

    expect(response.statusCode).to.equal(status)
    if (redirect) {
      expect(response.headers.location).to.equal(redirect)
    } else {
      expect(response.headers.location).to.be.undefined()
    }
  },

  getCookies: (response) => {
    const cookies = {}
    response.headers['set-cookie'] && response.headers['set-cookie'].forEach((cookie) => {
      const parts = (cookie.split(';')[0]).match(/(.*?)=(.*)$/)
      cookies[parts[1].trim()] = (parts[2] || '').trim()
    })
    return cookies
  }

}

module.exports = {
  run: async (requests) => {
    internals.counter = 0
    delete internals.sid
    for (const request of requests) {
      await internals.run(request)
    }
  },
  getCookies: internals.getCookies
}
