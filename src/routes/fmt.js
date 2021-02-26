'use strict'
const Joi = require('@hapi/joi')
const id = Joi.string()

/**
 * These routes are scanned automatically by the hapi-router
 */
const LoginHandler = require('../handlers/login')
const FailedLogin = require('../handlers/login-fail')
const LicenceHandler = require('../handlers/licence')
const ReportsHandler = require('../handlers/reports')
const ReportDownloadHandler = require('../handlers/report-download')
const RecordsHandler = require('../handlers/records')
const RecordsSearchResultsHandler = require('../handlers/records-search-results')
const LookupHandler = require('../handlers/lookup')
const AgeWeightKeyHandler = require('../handlers/age-weight-key')
const AgeWeightKeyOkHandler = require('../handlers/age-weight-key-ok')
const AgeWeightKeyConflictCheckHandler = require('../handlers/age-weight-key-conflict-check')
const AgeWeightKeyErrorBreakdownHandler = require('../handlers/age-weight-key-error-breakdown')
const AgeWeightKeyCancel = require('../handlers/age-weight-key-cancel')
const ExclusionsHandler = require('../handlers/exclusions')

// Define the validators
const loginValidator = require('../validators/login')
const licenceValidator = require('../validators/licence')
const ageWeightKeyValidator = require('../validators/age-weight-key')
const ageWeightKeyConflictValidator = require('../validators/age-weight-key-conflict')

// Define the handlers
const loginHandler = new LoginHandler('login', loginValidator)
const failedLogin = new FailedLogin('login', loginValidator)
const reportsHandler = new ReportsHandler('reports')
const reportDownloadHandler = new ReportDownloadHandler()
const recordsHandler = new RecordsHandler('records')
const recordsSearchResultsHandler = new RecordsSearchResultsHandler('records-search-results')
const licenceHandler = new LicenceHandler('licence', licenceValidator)
const lookupHandler = new LookupHandler('lookup')
const ageWeightKeyHandler = new AgeWeightKeyHandler('age-weight-key', ageWeightKeyValidator, 'ageWeightContext')
const ageWeightKeyOkHandler = new AgeWeightKeyOkHandler('age-weight-key-ok', null, 'ageWeightContext')
const ageWeightKeyConflictCheckHandler = new AgeWeightKeyConflictCheckHandler('age-weight-key-conflict-check',
  ageWeightKeyConflictValidator, 'ageWeightContext')
const ageWeightKeyErrorBreakdownHandler = new AgeWeightKeyErrorBreakdownHandler('age-weight-key-error-breakdown',
  null, 'ageWeightContext')
const ageWeightKeyCancel = new AgeWeightKeyCancel(null, null, 'ageWeightContext')
const exclusionsHandler = new ExclusionsHandler('exclusions')

const api = {
  host: process.env.API_HOSTNAME || 'localhost',
  port: Number.parseInt(process.env.API_PORT || 9580),
  protocol: 'http'
}

const lookupQuerySchema = Joi.object({
  submissionId: id.required(),
  activityId: id.optional(),
  catchId: id.optional(),
  smallCatchId: id.optional()
}).oxor('activityId', 'catchId', 'smallCatchId')

/*
 * The following set of handlers are the additional set of handlers
 * required by the FMT interface
 */
module.exports = [

  // Login GET handler
  {
    path: '/login',
    method: 'GET',
    handler: loginHandler.handler,
    options: { auth: false }
  },

  // Login POST handler
  {
    path: '/login',
    method: 'POST',
    handler: loginHandler.handler,
    options: { auth: { strategies: ['active-dir-strategy', 'session'] } }
  },

  // Failed Login GET handler
  {
    path: '/login-fail',
    method: 'GET',
    handler: failedLogin.handler,
    options: { auth: false }
  },

  // Failed Login POST handler
  {
    path: '/login-fail',
    method: 'POST',
    handler: failedLogin.handler,
    options: { auth: { strategies: ['active-dir-strategy', 'session'] } }
  },

  /*
   * The remaining set of handlers are secured by the default authorization strategy -
   * using hapi-auth-cookie
   */
  // Licence not found GET handler
  {
    path: '/licence',
    method: ['GET', 'POST'],
    handler: licenceHandler.handler
  },

  // Records handler
  {
    path: '/records',
    method: ['GET', 'POST'],
    handler: recordsHandler.handler
  },
  
  // Records handler
  {
    path: '/records-search-results',
    method: ['GET'],
    handler: recordsSearchResultsHandler.handler
  },

  // Reports handler
  {
    path: '/reports',
    method: 'GET',
    handler: reportsHandler.handler
  },

  // Report download handler
  {
    path: '/reports/{file}',
    method: 'GET',
    handler: reportDownloadHandler.handler
  },

  // Age weight key upload handlers
  {
    path: '/age-weight-key',
    method: 'GET',
    handler: ageWeightKeyHandler.handler
  },

  // Age weight key upload handlers
  {
    path: '/age-weight-key',
    method: 'POST',
    handler: ageWeightKeyHandler.handler,
    options: {
      payload: {
        multipart: true,
        allow: 'multipart/form-data',
        output: 'file',
        parse: true,
        maxBytes: 1000 * 1000,
        uploads: require('../../defaults').TEMP
      },
      plugins: {
        disinfect: {
          disinfectQuery: true,
          disinfectParams: true,
          disinfectPayload: false
        }
      }
    }
  },

  // Age weight key upload success handler
  {
    path: '/age-weight-key-ok',
    method: 'GET',
    handler: ageWeightKeyOkHandler.handler
  },

  // Age weight key conflict check handlers
  {
    path: '/age-weight-key-conflict-check',
    method: 'GET',
    handler: ageWeightKeyConflictCheckHandler.handler
  },

  // Age weight key conflict check handlers
  {
    path: '/age-weight-key-conflict-check',
    method: 'POST',
    handler: ageWeightKeyConflictCheckHandler.handler,
    options: {
      payload: {
        multipart: true,
        allow: 'multipart/form-data',
        output: 'file',
        parse: true,
        maxBytes: 1000 * 1000,
        uploads: require('../../defaults').TEMP
      },
      plugins: {
        disinfect: {
          disinfectQuery: true,
          disinfectParams: true,
          disinfectPayload: false
        }
      }
    }
  },

  // Age weight key error breakdown handler
  {
    path: '/age-weight-key-error-breakdown',
    method: ['GET', 'POST'],
    handler: ageWeightKeyErrorBreakdownHandler.handler
  },

  // Age weight key cancel
  {
    path: '/age-weight-key-cancel',
    method: 'GET',
    handler: ageWeightKeyCancel.handler
  },

  // Lookup handler
  {
    path: '/lookup',
    method: 'GET',
    handler: lookupHandler.handler,
    options: {
      validate: {
        query: lookupQuerySchema
      }
    }
  },

  // Back to the catch return from the reports
  {
    path: '/back',
    method: 'GET',
    handler: async (request, h) => {
      return h.redirect(((cache) => {
        if (cache.back) {
          return cache.back
        } else if (cache.contactId) {
          return '/summary'
        } else {
          return '/licence'
        }
      })(await request.cache().get()))
    }
  },

  // End session handler
  {
    path: '/logout',
    method: 'GET',
    handler: async (request, h) => {
      await request.cache().drop()
      request.cookieAuth.clear()
      return h.redirect('/')
    }
  },

  // The exclusions handler
  {
    path: '/exclusions',
    method: 'POST',
    handler: exclusionsHandler.handler,
    options: {
      plugins: {
        crumb: { restful: true }
      }
    }
  },

  {
    method: ['GET', 'POST'],
    path: '/reporting/{reports*}',
    options: {
      auth: false,
      plugins: {
        disinfect: {
          disinfectQuery: true,
          disinfectParams: true,
          disinfectPayload: false
        },
        crumb: false
      }
    },
    handler: {
      proxy: {
        mapUri: (request) => {
          const mappedUri = new URL(`http://${api.host}:${api.port}/api/reporting/${request.params.reports}`)
          if (request.query) {
            mappedUri.search = new URLSearchParams(request.query)
          }
          return {
            uri: mappedUri.href
          }
        },
        passThrough: true,
        acceptEncoding: true
      }
    }
  }
]
