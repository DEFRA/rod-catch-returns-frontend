const fmt = require('../../src/routes/fmt')

describe('fmt', () => {
  describe('/login', () => {
    const loginRoute = fmt.find(route => route.path === '/login')

    it('should have a /login route with auth as false', () => {
      expect(loginRoute.options).toStrictEqual({
        auth: false,
        plugins: {
          crumb: false
        }
      })
    })
  })

  describe('/oidc/signin', () => {
    const oidcSignIn = fmt.find(route => route.path === '/oidc/signin')

    it('should have a /oidc/signin route with auth as false', () => {
      expect(oidcSignIn.options).toStrictEqual({
        auth: false,
        plugins: {
          crumb: false
        }
      })
    })
  })
})
