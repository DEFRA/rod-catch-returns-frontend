const { Notifier } = require('@airbrake/node')
const AirbrakeClient = require('../../src/lib/airbrake')
const logger = require('../../src/lib/logger-utils')

jest.mock('@airbrake/node')
jest.mock('../../src/lib/logger-utils')

expect.extend({
  errorWithMessageMatching (received, ...matchers) {
    try {
      expect(received).toBeInstanceOf(Error)
      for (const matcher of matchers) {
        if (!matcher.asymmetricMatch(received.message)) {
          return {
            message: () => `expected ${matcher.toString()} to pass`,
            pass: false
          }
        }
      }
      return { pass: true }
    } catch (e) {
      return { message: () => e.message, pass: false }
    }
  }
})

describe('airbrake', () => {
  const OLD_ENV = process.env

  const getMockNotifier = () => ({
    notify: jest.fn(),
    flush: jest.fn(),
    close: jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }

    process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
    process.env.AIRBRAKE_PROJECT_KEY = '123'
  })

  afterEach(() => {
    process.env = OLD_ENV
    process.removeAllListeners('uncaughtExceptionMonitor')
    process.removeAllListeners('uncaughtException')
    process.removeAllListeners('unhandledRejection')
  })

  describe('constructor', () => {
    it('does not initialise airbrake if the required environment variables are missing', async () => {
      delete process.env.AIRBRAKE_HOST
      delete process.env.AIRBRAKE_PROJECT_KEY

      const airbrake = new AirbrakeClient()

      expect(Notifier).not.toHaveBeenCalled()
    })

    it('logs an info message if the required environment variables are missing', async () => {
      delete process.env.AIRBRAKE_HOST
      delete process.env.AIRBRAKE_PROJECT_KEY

      const airbrake = new AirbrakeClient()

      expect(logger.info).toHaveBeenCalledWith(
        '[Airbrake] Not initialised. Missing environment variables:',
        { AIRBRAKE_HOST: false, AIRBRAKE_PROJECT_KEY: false }
      )
    })

    it('initialises airbrake if the required environment variables are present', async () => {
      const airbrake = new AirbrakeClient()

      expect(Notifier).toHaveBeenCalled()
    })

    it('intercepts console.error and reports to Airbrake', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      const airbrake = new AirbrakeClient()

      const error = new Error('Test error')
      console.error(error)

      expect(mockNotifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          params: expect.objectContaining({
            consoleInvocationDetails: expect.objectContaining({
              method: 'error',
              arguments: expect.arrayContaining([expect.any(String)])
            })
          })
        })
      )
    })

    it('intercepts console.warn and reports to Airbrake', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      const airbrake = new AirbrakeClient()
      const warning = 'Test warning'

      console.warn(warning)

      expect(mockNotifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          params: expect.objectContaining({
            consoleInvocationDetails: expect.objectContaining({
              method: 'warn',
              arguments: expect.arrayContaining([
                expect.stringContaining(warning)
              ])
            })
          })
        })
      )
    })

    it.each([
      [
        'should output the request state if it is present',
        { state: { sid: 'abc123' }, headers: {} },
        { session: { sid: 'abc123' }, context: {} }
      ],
      [
        'should output the request path in the context object if it is present',
        { method: 'GET', path: '/path', headers: {} },
        { context: { action: 'GET /path' } }
      ],
      [
        'should output the user agent in the context object if it is present',
        { headers: { 'user-agent': 'chrome' } },
        { context: { userAgent: 'chrome' } }
      ]
    ])('%s', (_, requestDetail, expectedContext) => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      const airbrake = new AirbrakeClient()

      console.error(
        'Error processing request. Request: %j, Exception: %o',
        requestDetail,
        {}
      )

      expect(mockNotifier.notify).toHaveBeenLastCalledWith({
        error: expect.errorWithMessageMatching(expect.stringMatching('Error')),
        params: expect.objectContaining({
          consoleInvocationDetails: {
            arguments: expect.any(Object),
            method: 'error'
          }
        }),
        environment: expect.any(Object),
        ...expectedContext
      })
    })

    it('should output the environment if process.env.name is present', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      process.env.name = 'test'
      const airbrake = new AirbrakeClient()

      console.error(
        'Error processing request. Request: %j, Exception: %o',
        {},
        {}
      )

      expect(mockNotifier.notify).toHaveBeenLastCalledWith({
        error: expect.errorWithMessageMatching(expect.stringMatching('Error')),
        params: expect.objectContaining({
          consoleInvocationDetails: {
            arguments: expect.any(Object),
            method: 'error'
          }
        }),
        context: {},
        environment: { name: 'test' }
      })
    })

    it.each([
      [['A single string'], 'A single string'],
      [
        ['A string with %d %s arguments', 2, 'formatting'],
        'A string with 2 formatting arguments'
      ],
      [
        ['Test', 'multiple', 'strings', 'with', 'no', 'format'],
        'Test multiple strings with no format'
      ],
      [[new Error('Test error pos 1'), 'another string'], 'Test error pos 1'],
      [['another string', new Error('Test error pos 2')], 'Test error pos 2']
    ])(
      'formats the error message in a consistent manner with the native console.error call: [%j] === %s',
      async (input, output) => {
        const mockNotifier = getMockNotifier()
        Notifier.mockImplementation(() => mockNotifier)
        const airbrake = new AirbrakeClient()

        console.error(...input)

        expect(mockNotifier.notify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching(output)),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: expect.any(Object),
              method: 'error'
            }
          }),
          context: {},
          environment: expect.any(Object)
        })
      }
    )

    it('hooks the process for uncaughtExceptions', async () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(jest.fn())
      const airbrake = new AirbrakeClient()

      const testError = new Error('Test error')
      process.emit('uncaughtException', testError)

      await new Promise((resolve) => setImmediate(resolve))

      expect(mockNotifier.flush).toHaveBeenCalled()
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it.each([['uncaughtException'], ['unhandledRejection']])(
      'hooks the process for %s',
      async (event) => {
        const mockNotifier = getMockNotifier()
        Notifier.mockImplementation(() => mockNotifier)
        const processExitSpy = jest
          .spyOn(process, 'exit')
          .mockImplementation(jest.fn())
        const airbrake = new AirbrakeClient()

        const testError = new Error('Test error')
        process.emit(event, testError)

        await new Promise((resolve) => setImmediate(resolve))

        expect(mockNotifier.flush).toHaveBeenCalled()
        expect(processExitSpy).toHaveBeenCalledWith(1)
      }
    )
  })

  describe('reportToAirbrake', () => {
    it('does nothing when airbrake is not initialised', () => {
      delete process.env.AIRBRAKE_HOST
      delete process.env.AIRBRAKE_PROJECT_KEY

      const airbrake = new AirbrakeClient()
      airbrake.reportToAirbrake('error', 'test')

      expect(Notifier).not.toHaveBeenCalled()
    })

    it('sends an Error instance when the first arg is not an error', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)

      const airbrake = new AirbrakeClient()
      airbrake.reportToAirbrake('warn', 'simple message')

      expect(mockNotifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              method: 'warn',
              arguments: expect.any(Array)
            }
          }),
          context: {},
          environment: {}
        })
      )
    })

    it('uses the Error instance passed in args when present', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)

      const airbrake = new AirbrakeClient()
      const error = new Error('boom')
      airbrake.reportToAirbrake('error', 'something happened', error)

      expect(mockNotifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          error,
          params: expect.objectContaining({
            consoleInvocationDetails: expect.objectContaining({
              method: 'error'
            })
          })
        })
      )
    })

    it('captures request state and adds it to the session object', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)

      const airbrake = new AirbrakeClient()
      const request = { state: { id: '123' }, headers: {} }

      airbrake.reportToAirbrake('error', request)

      expect(mockNotifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          session: { id: '123' }
        })
      )
    })

    it('captures request method/path and maps to context.action', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)

      const airbrake = new AirbrakeClient()
      const request = { method: 'POST', path: '/abc', headers: {} }

      airbrake.reportToAirbrake('error', request)

      expect(mockNotifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { action: 'POST /abc' }
        })
      )
    })

    it('includes user agent in context when available', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)

      const airbrake = new AirbrakeClient()
      const request = { headers: { 'user-agent': 'Mozilla/5.0' } }

      airbrake.reportToAirbrake('warn', request)

      expect(mockNotifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { userAgent: 'Mozilla/5.0' }
        })
      )
    })

    it('includes environment name when process.env.name is set', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      process.env.name = 'int-test'

      const airbrake = new AirbrakeClient()
      airbrake.reportToAirbrake('error', 'oops')

      expect(mockNotifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: { name: 'int-test' }
        })
      )
    })
  })

  describe('flush', () => {
    it('should flush and close Notifier, when airbrake is flushed, if it is initialised', async () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      const airbrake = new AirbrakeClient()
      await airbrake.flush()

      expect(mockNotifier.flush).toHaveBeenCalled()
      expect(mockNotifier.close).toHaveBeenCalled()
    })

    it('should not flush and close Notifier, when airbrake is flushed, if it is not initialised', async () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      delete process.env.AIRBRAKE_HOST
      delete process.env.AIRBRAKE_PROJECT_KEY

      const airbrake = new AirbrakeClient()
      await airbrake.flush()

      expect(mockNotifier.flush).not.toHaveBeenCalled()
      expect(mockNotifier.close).not.toHaveBeenCalled()
    })
  })

  describe('attachAirbrakeToDebugLogger', () => {
    it('returns the log function when airbrake is not available', () => {
      delete process.env.AIRBRAKE_HOST
      delete process.env.AIRBRAKE_PROJECT_KEY
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      const mockLogFunction = jest.fn()
      const airbrake = new AirbrakeClient()
      const logFunction = airbrake.attachAirbrakeToDebugLogger(mockLogFunction)

      logFunction('test message')

      expect(mockLogFunction).toHaveBeenCalledWith('test message')
      expect(mockNotifier.notify).not.toHaveBeenCalled()
    })

    it('attaches Airbrake reporting to the log function when airbrake is available', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      const mockLogFunction = jest.fn()
      const airbrake = new AirbrakeClient()
      const logFunction = airbrake.attachAirbrakeToDebugLogger(mockLogFunction)

      logFunction('test message')

      expect(mockLogFunction).toHaveBeenCalledWith('test message')
      expect(mockNotifier.notify).toHaveBeenCalled()
    })

    it('passes all arguments to both notify and the log function', () => {
      const mockNotifier = getMockNotifier()
      Notifier.mockImplementation(() => mockNotifier)
      const mockLogFunction = jest.fn()
      mockLogFunction.namespace = 'testNamespace'
      const airbrake = new AirbrakeClient()
      const logFunction = airbrake.attachAirbrakeToDebugLogger(mockLogFunction)

      logFunction('test message', 123, { some: 'object' })

      expect(mockLogFunction).toHaveBeenCalledWith('test message', 123, {
        some: 'object'
      })
      expect(mockNotifier.notify).toHaveBeenCalledWith({
        error: expect.errorWithMessageMatching(
          expect.stringMatching('test message')
        ),
        params: expect.objectContaining({
          consoleInvocationDetails: {
            arguments: expect.any(Object),
            method: 'testNamespace'
          }
        }),
        context: {},
        environment: {}
      })
    })
  })
})
