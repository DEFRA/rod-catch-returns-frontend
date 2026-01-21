const angler = require('../../src/routes/angler')
const { getMockH } = require('../test-utils/server-test-utils')

describe('angler', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  describe('angler routes configuration', () => {
    it('exports an array of route definitions', () => {
      expect(angler.length).toBe(23)
    })

    it.each([
      '/',
      '/licence-auth',
      '/licence-auth-fail',
      '/select-year',
      '/did-you-fish',
      '/summary',
      '/activities/{id}',
      '/activities/{id}/clear',
      '/delete/activities/{id}',
      '/catches/{id}',
      '/catches/{id}/clear',
      '/delete/catches/{id}',
      '/small-catches/{id}',
      '/small-catches/{id}/clear',
      '/delete/small-catches/{id}',
      '/review',
      '/save',
      '/confirmation',
      '/cookies',
      '/accessibility',
      '/privacy'
    ])('contains route path "%s"', (expectedPath) => {
      const match = angler.find(r => r.path === expectedPath)
      expect(match).toBeDefined()
    })
  })

  describe('/', () => {
    const rootRoute = angler.find(route => route.path === '/')

    it('should redirect / to /licence-auth if it is the public site', () => {
      process.env.CONTEXT = 'ANGLER'
      const h = getMockH()

      rootRoute.handler({}, h)

      expect(h.redirect).toHaveBeenCalledWith('/licence-auth')
    })

    it('should redirect / to /licence if it is the admin site', () => {
      process.env.CONTEXT = 'FMT'
      const h = getMockH()
      rootRoute.handler({}, h)

      expect(h.redirect).toHaveBeenCalledWith('/licence')
    })
  })
})
