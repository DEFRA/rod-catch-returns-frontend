const fmt = require('../../src/routes/fmt')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/lib/antivirus')

describe('fmt', () => {
  describe('routes configuration', () => {
    it('exports an array of route definitions', () => {
      expect(fmt.length).toBe(20)
    })

    it.each([
      '/login',
      '/oidc/signin',
      '/oidc/account-disabled',
      '/oidc/account-role-required',
      '/licence',
      '/records',
      '/records-search-results',
      '/records-submissions',
      '/reports',
      '/reports/{file}',
      '/age-weight-key',
      '/age-weight-key-ok',
      '/age-weight-key-conflict-check',
      '/age-weight-key-error-breakdown',
      '/age-weight-key-cancel',
      '/lookup',
      '/back',
      '/exclusions'
    ])('contains route path "%s"', (expectedPath) => {
      const match = fmt.find(r => r.path === expectedPath)
      expect(match).toBeDefined()
    })
  })

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
