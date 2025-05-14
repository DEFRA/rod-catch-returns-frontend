const angler = require('../../src/routes/angler')
const { getMockH } = require('../test-utils/server-test-utils')

describe('angler', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV } // make a copy
  })

  afterEach(() => {
    process.env = OLD_ENV // restore old env
  })

  describe('/', () => {
    const rootRoute = angler.find(route => route.path === '/')

    it('should redirect to /licence-auth if it is the public site', () => {
      process.env.CONTEXT = 'ANGLER'
      const h = getMockH()

      rootRoute.handler({}, h)

      expect(h.redirect).toHaveBeenCalledWith('/licence-auth')
    })

    it('should redirect to /licence if it is the admin site', () => {
      process.env.CONTEXT = 'FMT'
      const h = getMockH()
      rootRoute.handler({}, h)

      expect(h.redirect).toHaveBeenCalledWith('/licence')
    })
  })
})
