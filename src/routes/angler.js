'use strict'

/**
 * These routes are scanned automatically by the hapi-router.
 * This is the standard set of routes used by the angler interface
 */
const LicenceAuthHandler = require('../handlers/licence-login')
const LicenceAuthNotFoundHandler = require('../handlers/licence-login-fail')

const DidYouFishHandler = require('../handlers/did-you-fish')
const YearHandler = require('../handlers/year')
const SummaryHandler = require('../handlers/summary')
const ActivityHandler = require('../handlers/activities')
const DeleteActivityHandler = require('../handlers/delete-activity')
const SalmonAndLargeTroutHandler = require('../handlers/salmon-and-large-trout')
const DeleteSalmonAndLargeTroutHandler = require('../handlers/delete-salmon-and-large-trout')
const SmallCatchHandler = require('../handlers/small-catches')
const DeleteSmallCatchHandler = require('../handlers/delete-small-catch')
const ConfirmationHandler = require('../handlers/confirmation')
const ReviewHandler = require('../handlers/review')
const SaveHandler = require('../handlers/save')

// Define the validators
const loginValidator = require('../validators/login')
const yearValidator = require('../validators/year')
const didYouFishValidator = require('../validators/did-you-fish')
const activityValidator = require('../validators/activity')
const salmonAndLargeTroutValidator = require('../validators/salmon-and-large-trout')
const smallCatchValidator = require('../validators/small-catch')

// Define the handlers
const licenceAuthHandler = new LicenceAuthHandler('licence', loginValidator)
const licenceAuthNotFound = new LicenceAuthNotFoundHandler('licence', loginValidator)
const yearHandler = new YearHandler('select-year', yearValidator)

const didYouFishHandler = new DidYouFishHandler('did-you-fish', didYouFishValidator)
const summaryHandler = new SummaryHandler('summary')
const activityHandler = new ActivityHandler('activity', activityValidator)
const deleteActivityHandler = new DeleteActivityHandler('delete-activity', activityValidator)
const salmonAndLargeTroutHandler = new SalmonAndLargeTroutHandler('salmon-and-large-trout', salmonAndLargeTroutValidator)
const deleteSalmonAndLargeTroutHandler = new DeleteSalmonAndLargeTroutHandler('delete-salmon-and-large-trout')
const smallCatchHandler = new SmallCatchHandler('small-catches', smallCatchValidator)
const deleteSmallCatchHandler = new DeleteSmallCatchHandler('delete-small-catch')
const reviewHandler = new ReviewHandler('review')
const confirmationHandler = new ConfirmationHandler('confirmation')
const saveHandler = new SaveHandler('save')

module.exports = [

  // Redirect to the start page
  {
    path: '/',
    method: 'GET',
    options: { auth: false },
    handler: (request, h) => {
      return process.env.CONTEXT === 'ANGLER' ? h.redirect('/licence-auth') : h.redirect('/login')
    }
  },

  /*
   * The following set of handlers are concerned with angler login - those users authenticated
   * by the CRM using their licence and postcode
   */

  // Licence auth handler
  {
    path: '/licence-auth',
    method: 'GET',
    handler: licenceAuthHandler.handler,
    options: { auth: false }
  },

  // Licence auth POST handler
  {
    path: '/licence-auth',
    method: 'POST',
    handler: licenceAuthHandler.handler,
    options: { auth: { strategies: ['licence-strategy', 'session'] } }
  },

  // Licence not found GET handler
  {
    path: '/licence-auth-fail',
    method: 'GET',
    handler: licenceAuthNotFound.handler,
    options: { auth: false }
  },

  // Licence not found POST handler
  {
    path: '/licence-auth-fail',
    method: 'POST',
    handler: licenceAuthHandler.handler,
    options: { auth: { strategies: ['licence-strategy', 'session'] } }
  },

  // Year handler
  {
    path: '/select-year',
    method: ['GET', 'POST'],
    handler: yearHandler.handler
  },

  // Did you fish
  {
    path: '/did-you-fish',
    method: ['GET', 'POST'],
    handler: didYouFishHandler.handler
  },

  // Summary handler
  {
    path: '/summary',
    method: ['GET', 'POST'],
    handler: summaryHandler.handler
  },

  // Activity handler
  {
    path: '/activities/{id}',
    method: ['GET', 'POST'],
    handler: activityHandler.handler
  },

  // Delete activity handler
  {
    path: '/delete/activities/{id}',
    method: ['GET', 'POST'],
    handler: deleteActivityHandler.handler
  },

  // Add/edit salmon and large sea trout handler
  {
    path: '/catches/{id}',
    method: ['GET', 'POST'],
    handler: salmonAndLargeTroutHandler.handler
  },

  // Delete salmon and sea trout handler
  {
    path: '/delete/catches/{id}',
    method: ['GET', 'POST'],
    handler: deleteSalmonAndLargeTroutHandler.handler
  },

  // Add/edit the small catch handler
  {
    path: '/small-catches/{id}',
    method: ['GET', 'POST'],
    handler: smallCatchHandler.handler
  },

  // Delete the small catch handler
  {
    path: '/delete/small-catches/{id}',
    method: ['GET', 'POST'],
    handler: deleteSmallCatchHandler.handler
  },

  // Submission handler
  {
    path: '/review',
    method: ['GET', 'POST'],
    handler: reviewHandler.handler
  },

  // Confirmation handler
  {
    path: '/save',
    method: 'GET',
    handler: saveHandler.handler
  },

  // Confirmation handler
  {
    path: '/confirmation',
    method: 'GET',
    handler: confirmationHandler.handler
  },

  // Error 500 handler
  {
    path: '/error500',
    method: 'GET',
    options: { auth: false },
    handler: (request, h) => {
      return h.view('error500')
    }
  },

  // Error 4xx handler
  {
    path: '/error/{status}',
    method: 'GET',
    options: { auth: false },
    handler: (request, h) => {
      return h.view('error4', { status: request.params.status })
    }
  },

  // Catch all
  {
    method: '*',
    path: '/{p*}',
    handler: function (request, h) {
      return h.redirect('/')
    },
    options: { auth: false }
  }

]
