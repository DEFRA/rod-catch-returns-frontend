'use strict'

/**
 * The entry point of the rod catch returns web service. This is a hapi web server
 * and uses glue to compose the server.
 *
 */

require('dotenv').config()

const Glue = require('@hapi/glue')
const Nunjucks = require('nunjucks')
const Uuid = require('uuid')
const Crypto = require('crypto')
const { logger } = require('defra-logging-facade')
const HapiGapi = require('@defra/hapi-gapi')

const AuthorizationSchemes = require('./src/lib/authorization-schemes')
const AuthorizationStrategies = require('./src/lib/authorization-strategies')
const EnvironmentSchema = require('./environment-schema')
const CacheDecorator = require('./src/lib/cache-decorator')
const { checkTempDir } = require('./src/lib/misc')
const manFishing = require('./manFishing')
const { sessionIdProducer } = require('./src/lib/analytics')

const manifest = {
  // Configure Hapi server and server-caching subsystem
  server: {
    port: process.env.PORT || 3000,
    cache: [
      {
        name: 'server-cache',
        provider: {
          constructor: require('@hapi/catbox-redis'),
          options: {
            host: process.env.REDIS_HOSTNAME,
            port: process.env.REDIS_PORT,
            partition: 'server-cache'
          }
        }
      }
    ],
    routes: { security: { noOpen: false } }
  },

  // Register plugins
  register: {
    plugins: [
      /*
       * Using the DEFRA logging package
       * See: https://github.com/DEFRA/defra-logging-facade
       */
      {
        plugin: require('defra-logging-facade').HapiErrorLoggerPlugin
      },
      /*
       * Static file and directory handlers plugin for hapi.js
       * See https://www.npmjs.com/package/inert
       */
      {
        plugin: require('@hapi/inert')
      },

      /*
       * Templates rendering plugin support for hapi.js
       * See https://www.npmjs.com/package/vision
       */
      {
        plugin: require('@hapi/vision')
      },

      /*
       * Plug in for cookie based authentication
       * See https://www.npmjs.com/package/hapi-auth-cookie
       */
      {
        plugin: require('@hapi/cookie'),
        options: {
          mode: 'required'
        }
      },

      /*
       * Add a rudimentary health check
       * hit /health and check status 200
       * See: https://www.npmjs.com/package/hapi-alive
       */
      {
        plugin: require('hapi-alive'),
        options: {
          responses: {
            healthy: {
              message: 'Healthy'
            },
            unhealthy: {
              statusCode: 400
            }
          }
        }
      },

      /*
       * Plugin for serving up robots.txt
       * See https://www.npmjs.com/package/hapi-robots and
       * https://en.wikipedia.org/wiki/Robots_exclusion_standard
       */
      {
        plugin: require('hapi-robots'),
        options: {
          // will disallow everyone from every path:
          '*': ['/']
        }
      },

      /*
       * This plugin handles direct proxying through to the API
       * See https://github.com/hapijs/h2o2
       */
      {
        plugin: require('@hapi/h2o2')
      },

      /*
       * To print routes on startup change showStart to true
       * See https://www.npmjs.com/package/blipp
       */
      {
        plugin: require('blipp'),
        options: {
          showStart: false
        }
      },

      /*
       * Clean up any input
       * See: https://www.npmjs.com/package/disinfect
       */
      {
        plugin: require('disinfect'),
        options: {
          disinfectQuery: true,
          disinfectParams: true,
          disinfectPayload: true
        }
      },

      /*
       * Plugin for CSRF tokens
       * See https://www.npmjs.com/package/crumb
       */
      {
        plugin: require('@hapi/crumb'),
        options: {
          key: 'rcr2018',
          cookieOptions: {
            isSecure: process.env.HTTPS === 'true' || false,
            isHttpOnly: true
          },
          logUnauthorized: true
        }
      },

      /**
       * Plugin to set content security policy headers
       * see: https://www.npmjs.com/package/blankie
       */

      {
        plugin: require('blankie'),
        options: {
          generateNonces: false, // Seems to prevent the print dialog
          defaultSrc: 'self',
          scriptSrc: [
            'self',
            'unsafe-inline',
            'unsafe-eval',
            'www.googletagmanager.com',
            'tagmanager.google.com',
            'www.google-analytics.com',
            'ssl.google-analytics.com'
          ],
          styleSrc: [
            'self',
            'unsafe-inline',
            'tagmanager.google.com',
            'fonts.googleapis.com'
          ],
          imgSrc: [
            'self',
            'www.googletagmanager.com',
            'www.google-analytics.com',
            'ssl.gstatic.com',
            'www.gstatic.com',
            'data:'
          ],
          fontSrc: ['self', 'fonts.gstatic.com', 'data:'],
          connectSrc: ['self', 'www.google-analytics.com']
        }
      },

      /**
       * Required by blankie
       * See: https://github.com/hapijs/scooter
       */
      {
        plugin: require('@hapi/scooter')
      }
    ]
  }
}

const options = {
  relativeTo: __dirname
};

(async () => {
  try {
    /**
     * Test that the environment is set up correctly
     */
    EnvironmentSchema.validate(process.env, { allowUnknown: true }, (err) => {
      if (err) {
        throw new Error('Schema validation error: ' + err.message)
      }
    })

    const server = await Glue.compose(manifest, options)
    /*
     * Set up the nunjunks rendering engine and include the new gov.uk
     * design system templates and components so that the macros are accessible
     * directly in the templates.
     *
     * Note that vision caches compiled templates according to the isCached flag and so the
     * watch flag in the prepare function is set to false,
     * see https://github.com/hapijs/vision/issues/75
     *
     * The options supplied to the nunjunks processor in the prepare function are generated by the
     * vision template rendering support and hapi itself
     */
    server.views({
      engines: {
        html: {
          compile: function (src, options) {
            const template = Nunjucks.compile(src, options.environment)
            return function (context) {
              return template.render(context)
            }
          },
          prepare: (options, next) => {
            options.compileOptions.environment = Nunjucks.configure(
              options.path,
              { watch: false }
            )

            // Add a custom filter for use to test the existence of a key on an object
            options.compileOptions.environment.addFilter(
              'existsOn',
              (obj, item) => Object.keys(obj || {}).includes(item)
            )
            return next()
          }
        }
      },

      isCached: process.env.NODE_ENV !== 'development',
      relativeTo: __dirname,
      path: [
        'src/views',
        'src/views/macros',
        'node_modules/govuk-frontend/dist/govuk/',
        'node_modules/govuk-frontend/dist/govuk/components/'
      ],

      // Set up the common view data
      context: () => {
        return {
          pgid: Uuid.v4(),
          fmt: process.env.CONTEXT === 'FMT',
          ga: process.env.GA_TRACKING_ID
        }
      }
    })

    // Set up the route handlers for static resources
    server.route({
      method: 'GET',
      path: '/public/{param*}',
      config: {
        auth: false
      },
      handler: {
        directory: {
          path: 'public'
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/favicon.ico',
      config: {
        auth: false
      },
      handler: {
        file: {
          path: 'public/images/favicon.ico'
        }
      }
    })

    // Point the server plugin cache to an application cache to hold authenticated session data
    server.app.cache = server.cache({
      cache: 'server-cache',
      segment: 'sessions',
      expiresIn: process.env.SESSION_TTL_MS
    })

    server.auth.scheme('licence-scheme', AuthorizationSchemes.licenceScheme)
    server.auth.strategy('licence-strategy', 'licence-scheme')
    server.auth.strategy(
      'session',
      'cookie',
      process.env.CONTEXT === 'FMT' ? AuthorizationStrategies.adminCookie : AuthorizationStrategies.sessionCookie
    )
    server.auth.default('session')

    /*
     * Plugin to automatically load the routes based on their file location
     * See https://www.npmjs.com/package/hapi-router. Run last so the default authentication
     * strategy can be registered first
     */
    await server.register({
      plugin: require('hapi-router'),
      options: {
        routes:
          process.env.CONTEXT === 'FMT'
            ? './src/routes/*.js'
            : './src/routes/angler.js'
      }
    })

    /*
     * Decorator to make access to the session cache available as
     * simple setters and getters hiding the session key.
     */
    server.decorate('request', 'cache', CacheDecorator)

    /*
     * HapiGapi plugin
     */
    await server.register({
      plugin: HapiGapi,
      options: {
        propertySettings: [
          {
            id: process.env.GA_TRACKING_ID,
            hitTypes: ['pageview', 'event', 'ecommerce']
          }
        ],
        sessionIdProducer: sessionIdProducer,
        batchSize: 20,
        batchInterval: 15000
      }
    })

    /*
     * Test that cryptographic support is enabled on the build
     */
    try {
      require('crypto')
    } catch (err) {
      logger.error('Crypto support disabled: ' + err)
      process.exit(1)
    }

    // Register an onPreResponse handler so that errors can be properly trapped.
    server.ext('onPreResponse', (request, h) => {
      if (request.response.isBoom) {
        // An error occurred processing the request
        const statusCode = request.response.output.statusCode || 500

        if (Math.floor(statusCode / 100) === 4) {
          // Custom handling for 4xx codes
          return h.view('error4', { status: statusCode }).code(statusCode)
        } else {
          // 5xx Server failure, log an error to airbrake/errbit - the response object is actually an instanceof Error
          logger.serverError(request.response, request)
          // Return a 500 to the client (avoid propagating other 5xx codes to the client)
          return h.view('error500').code(500)
        }
      }
      return h.continue
    })

    // Ensure we have created the temporary directory
    await checkTempDir()

    // Start the server
    await server.start()

    // Set a random cache key good for 30 years - shared between the nodes
    if (!(await server.app.cache.get('hub-identity'))) {
      logger.info('Assigning a new hub identity')
      await server.app.cache.set(
        'hub-identity',
        Crypto.randomBytes(16),
        1000 * 3600 * 24 * 365 * 30
      )
    }

    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      logger.info('Stopping server...')
      const err = await server.stop({ timeout: 10000 })
      logger.info('Stopped')
      process.exit(err ? 1 : 0)
    })

    // Attempt to log uncaught exceptions
    process.on('uncaughtExceptionMonitor', (err, origin) => {
      logger.error(`${err}:${origin}`)
      process.exit(1)
    })

    // Print the banner
    require('figlet')('Rod Catch Returns', function (err, data) {
      if (err) {
        return
      }
      console.log(manFishing)
      console.log(data)
      logger.info(`Server started at ${server.info.uri}`)
    })
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
})()
