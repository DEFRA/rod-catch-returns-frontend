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

  describe('sessionCookie', () => {
    it('should have the correct config', () => {
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.sessionCookie).toMatchSnapshot()
    })

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
  })

  describe('adminCookie', () => {
    it('should have the correct config', () => {
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.adminCookie).toMatchSnapshot()
    })

    it('should set cookie password if COOKIE_PW environment variable is present', () => {
      process.env.COOKIE_PW = 'cookie_password'
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.adminCookie.cookie.password).toBe('cookie_password')
    })

    it('should not set cookie password if COOKIE_PW environment variable is not present', () => {
      delete process.env.COOKIE_PW
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.adminCookie.cookie.password).toBeUndefined()
    })

    it('should set cookie isSecure to true if HTTPS environment variable is true', () => {
      process.env.HTTPS = 'true'
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.adminCookie.cookie.isSecure).toBeTruthy()
    })

    it('should set cookie isSecure to false if HTTPS environment variable is not set', () => {
      delete process.env.HTTPS
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.adminCookie.cookie.isSecure).toBeFalsy()
    })

    it('should set cookie isHttpOnly to true if HTTPS environment variable is true', () => {
      process.env.HTTPS = 'true'
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.adminCookie.cookie.isHttpOnly).toBeTruthy()
    })

    it('should set cookie isHttpOnly to false if HTTPS environment variable is not set', () => {
      delete process.env.HTTPS
      const authorizationStrategies = require('../../src/lib/authorization-strategies')
      expect(authorizationStrategies.adminCookie.cookie.isHttpOnly).toBeFalsy()
    })
  })
})
