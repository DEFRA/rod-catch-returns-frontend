const { formatWithOptions, inspect } = require('util')
const { Notifier } = require('@airbrake/node')
const logger = require('../lib/logger-utils')

const INSPECT_OPTS = {
  depth: null,
  maxStringLength: null,
  maxArrayLength: null,
  breakLength: null,
  compact: true,
  showHidden: true,
  errorNotifications: true
}

class AirbrakeClient {
  /**
   * Initializes the Airbrake client and intercepts `console.warn` and `console.error`
   * to send notifications to Airbrake/Errbit.
   *
   * If the required environment variables are not set, Airbrake will not be initialised.
   */
  constructor () {
    /** @type {Notifier} */
    this.airbrake = null

    const { AIRBRAKE_PROJECT_KEY, AIRBRAKE_HOST } = process.env

    if (!AIRBRAKE_PROJECT_KEY || !AIRBRAKE_HOST) {
      logger.info('[Airbrake] Not initialised. Missing environment variables:', {
        AIRBRAKE_PROJECT_KEY: !!AIRBRAKE_PROJECT_KEY,
        AIRBRAKE_HOST: !!AIRBRAKE_HOST
      })
      return
    }

    this.airbrake = new Notifier({
      projectId: 4,
      projectKey: process.env.AIRBRAKE_PROJECT_KEY,
      host: process.env.AIRBRAKE_HOST,
      environment: process.env.NODE_ENV,
      errorNotifications: true,
      performanceStats: false,
      remoteConfig: false
    })

    const originalError = console.error.bind(console)
    const originalWarn = console.warn.bind(console)

    console.error = (...args) => {
      this.reportToAirbrake('error', ...args)
      originalError(...args)
    }

    console.warn = (...args) => {
      this.reportToAirbrake('warn', ...args)
      originalWarn(...args)
    }

    // Ensure uncaught errors are logged
    process.on('uncaughtExceptionMonitor', originalError)

    // Override Airbrake's uncaughtException/unhandledRejection handlers to flush before exit
    const flushAndExit = async () => {
      await this.airbrake.flush()
      process.exit(1)
    }

    process.on('uncaughtException', flushAndExit)
    process.on('unhandledRejection', flushAndExit)
  }

  /**
   * Reports a method invocation to Airbrake.
   *
   * @param {string} method - The method being called (e.g., "warn" or "error").
   * @param {...any} args - The arguments passed to the method.
   * @returns {void}
   */
  reportToAirbrake (method, ...args) {
    if (!this.airbrake) {
      return
    }
    const error =
    args.find((arg) => arg instanceof Error) ??
    new Error(formatWithOptions(INSPECT_OPTS, ...args))

    const request = args.find(
      (arg) => arg && typeof arg === 'object' && 'headers' in arg
    )

    // notify returns a promise, but we do not await it
    this.airbrake.notify({
      error,
      params: {
        consoleInvocationDetails: {
          method,
          arguments: args.map((arg) => inspect(arg, INSPECT_OPTS))
        }
      },
      environment: {
        ...(process.env.name && { name: process.env.name })
      },
      ...(request?.state && { session: request.state }),
      context: {
        ...(request?.method && {
          action: `${request.method.toUpperCase()} ${request.path}`
        }),
        ...(request?.headers?.['user-agent'] && {
          userAgent: request.headers['user-agent']
        })
      }
    })
  }

  /**
   * Wraps a debug logging function so that log messages are also reported to Airbrake.
   *
   * @param {Function} logFunction - The debug logging function to wrap.
   * @returns {Function} A new logging function that reports to Airbrake before logging.
   */
  attachAirbrakeToDebugLogger (logFunction) {
    if (!this.airbrake) {
      return logFunction
    }

    return (...args) => {
      this.reportToAirbrake(logFunction.namespace, ...args)
      logFunction(...args)
    }
  }

  /**
   * Flushes the Airbrake buffer, ensuring that any pending notifications are sent
   * before returning.
   *
   * @returns {Promise<void>}
   */
  async flush () {
    if (this.airbrake) {
      await this.airbrake.flush()
      this.airbrake.close()
    }
  }
}

module.exports = AirbrakeClient
