const fmt = require('../../src/routes/fmt')
const { getMockH } = require('../test-utils/server-test-utils')

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

  describe('/oidc/account-disabled', () => {
    const accounDisabled = fmt.find(route => route.path === '/oidc/account-disabled')

    it('should have a /oidc/account-disabled route with auth as false', () => {
      expect(accounDisabled.options).toStrictEqual({
        auth: false,
        plugins: {
          crumb: false
        }
      })
    })

    it('should have a handler that shows the account disabled screen', () => {
      const h = getMockH()

      accounDisabled.handler({}, h)

      expect(h.view).toHaveBeenCalledWith('account-disabled')
    })
  })

  describe('/oidc/account-role-required', () => {
    const accountRoleRequired = fmt.find(route => route.path === '/oidc/account-role-required')

    it('should have a /oidc/account-role-required route with auth as false', () => {
      expect(accountRoleRequired.options).toStrictEqual({
        auth: false,
        plugins: {
          crumb: false
        }
      })
    })

    it('should have a handler that shows the role required screen', () => {
      const h = getMockH()

      accountRoleRequired.handler({}, h)

      expect(h.view).toHaveBeenCalledWith('account-role-required')
    })
  })
})
