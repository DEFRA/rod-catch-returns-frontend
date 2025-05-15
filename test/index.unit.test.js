const AuthorizationStrategies = require('../src/lib/authorization-strategies')

const mockServer = {
  auth: {
    strategy: jest.fn(),
    scheme: jest.fn(),
    default: jest.fn()
  },
  route: jest.fn(),
  register: jest.fn(),
  start: jest.fn(),
  views: jest.fn(),
  app: {

  },
  cache: jest.fn(),
  decorate: jest.fn(),
  ext: jest.fn()
}

jest.mock('@hapi/glue', () => ({
  compose: () => mockServer
}))
jest.mock('figlet')
jest.mock('../src/lib/authorization-strategies', () => ({
  adminCookie: { strategy: 'admin' },
  sessionCookie: { strategy: 'session' }
}))

describe('auth.strategy setup', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    delete process.env.CONTEXT
  })

  test('uses adminCookie strategy when CONTEXT is FMT', async () => {
    process.env.CONTEXT = 'FMT'
    await require('../index')

    expect(mockServer.auth.strategy).toHaveBeenCalledWith(
      'session',
      'cookie',
      AuthorizationStrategies.adminCookie
    )
  })

  test('uses sessionCookie strategy when CONTEXT is not FMT', async () => {
    process.env.CONTEXT = 'ANGLER'
    await require('../index')

    expect(mockServer.auth.strategy).toHaveBeenCalledWith(
      'session',
      'cookie',
      AuthorizationStrategies.sessionCookie
    )
  })
})
