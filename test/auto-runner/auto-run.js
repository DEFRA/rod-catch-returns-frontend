'use strict'

/**
 * This set of tests run the regression scripts in ./scripts using the
 * test runner
 */
const { logger } = require('defra-logging-facade')
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()

const experiment = lab.experiment
const test = lab.test
const Moment = require('moment')

const Runner = require('./runner')

const Client = require('../../src/api/client')
const licence = require('./scripts/requests').LICENCE
const postcode = require('./scripts/requests').POSTCODE
require('dotenv').config()

experiment('Scripted regression tests', () => {
  lab.before(async () => {
    logger.log('Running angler tests')
    process.env.CONTEXT = 'ANGLER'
    const contact = await Client.request(null, Client.method.GET, `licence/${licence}`, `verification=${postcode}`)

    if (!contact) {
      logger.error('Ensure the API is started in mock-mode and can find a contact for the licence: ' + licence)
      process.exit(-1)
    }

    let submission = await Client.request(null, Client.method.GET, 'submissions/search/getByContactIdAndSeason', `contact_id=${contact.contact.id}&season=${Moment().year()}`)
    if (submission && submission.statusCode !== 404) {
      logger.error('Tests require API to be restarted in in-memory mode for each test run')
      process.exit(-1)
    }
  })

  test('Sign in page', async () => {
    process.env.CONTEXT = 'ANGLER'
    await Runner.run(require('./scripts/sign-in').first)
  })

  test('Activity', async () => {
    process.env.CONTEXT = 'ANGLER'
    await Runner.run(require('./scripts/activity'))
  })

  test('Small catch', async () => {
    process.env.CONTEXT = 'ANGLER'
    await Runner.run(require('./scripts/small-catch'))
  })

  test('Large catch', async () => {
    process.env.CONTEXT = 'ANGLER'
    await Runner.run(require('./scripts/large-catch'))
  })

  test('Save and exit', async () => {
    process.env.CONTEXT = 'ANGLER'
    await Runner.run(require('./scripts/save'))
  })

  test('Review and submit', async () => {
    process.env.CONTEXT = 'ANGLER'
    await Runner.run(require('./scripts/review-and-submit'))
  })

  test('Sign into locked', async () => {
    process.env.CONTEXT = 'ANGLER'
    await Runner.run(require('./scripts/sign-in').locked)
  })

  test('FMT sign in', async () => {
    logger.log('Running FMT tests')
    process.env.CONTEXT = 'FMT'
    await Runner.run(require('./scripts/sign-in').fmt)
  })

  test('FMT unlock', async () => {
    process.env.CONTEXT = 'FMT'
    await Runner.run(require('./scripts/fmt-actions'))
  })
})
