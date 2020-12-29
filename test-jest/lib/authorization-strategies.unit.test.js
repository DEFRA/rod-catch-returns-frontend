describe('authorization-strategies', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...OLD_ENV } // make a copy
  })

  afterEach(() => {
    process.env = OLD_ENV // restore old env
  })

  describe('module.exports', () => {
    it('should set cookie password if COOKIE_PW environment variable is present', () => {
      process.env.COOKIE_PW = 'cookie_password'
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.sessionCookie.cookie.password).toBe('cookie_password')
    })

    it('should not set cookie password if COOKIE_PW environment variable is not present', () => {
      delete process.env.COOKIE_PW
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.sessionCookie.cookie.password).toBeUndefined()
    })

    it('should set cookie isSecure to true if HTTPS environment variable is true', () => {
      process.env.HTTPS = 'true'
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.sessionCookie.cookie.isSecure).toBeTruthy()
    })

    it('should set cookie isSecure to false if HTTPS environment variable is not set', () => {
      delete process.env.HTTPS
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.sessionCookie.cookie.isSecure).toBeFalsy()
    })

    it('should set redirectTo to /licence-auth if CONTEXT environment variable is ANGLER', () => {
      process.env.CONTEXT = 'ANGLER'
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.sessionCookie.redirectTo).toBe('/licence-auth')
    })

    it('should set redirectTo to /login if CONTEXT environment variable is not ANGLER', () => {
      process.env.CONTEXT = 'FMT'
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.sessionCookie.redirectTo).toBe('/login')
    })

    it('should set appendNext to true if CONTEXT environment variable is FMT', () => {
      process.env.CONTEXT = 'FMT'
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.sessionCookie.appendNext).toBeTruthy()
    })

    it('should set appendNext to false if CONTEXT environment variable is not FMT', () => {
      process.env.CONTEXT = 'ANGLER'
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.sessionCookie.appendNext).toBeFalsy()
    })
  })
})
