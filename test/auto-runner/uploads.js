const ROOT = require('../../defaults').ROOT_PATH

const Code = require('code')
const FormData = require('form-data')
const Fs = require('fs')
const Lab = require('@hapi/lab')
const Path = require('path')
const StreamToPromise = require('stream-to-promise')

const lab = exports.lab = Lab.script()

const expect = Code.expect
const experiment = lab.experiment
const test = lab.test

const Runner = require('./runner')
const minimalServer = require('./minimal-server')

const FMTUSER = String('admin1@example.com')
const FMTPASS = String('admin')

const DUPLICATE_HEADER = Path.join(ROOT, 'test/files/age-weight-key (duplicate header).csv')
const EMPTY_FILE = Path.join(ROOT, 'test/files/age-weight-key (empty).csv')
const INVALID_FORMAT = Path.join(ROOT, 'test/files/age-weight-key (invalid format).csv')
const INVALID_HEADER = Path.join(ROOT, 'test/files/age-weight-key (invalid header).csv')
const LARGE_UPLOAD_FILE = Path.join(ROOT, 'test/files/age-weight-key (large).csv')
const MISSING_COLUMN = Path.join(ROOT, 'test/files/age-weight-key (missing column).csv')
const MIXED_ERRORS = Path.join(ROOT, 'test/files/age-weight-key (mixed errors).csv')
const NOT_A_CSV = Path.join(ROOT, 'test/files/age-weight-key (not a csv).png')
const VALID_FILE = Path.join(ROOT, 'test/files/age-weight-key (valid).csv')

const YEAR = require('moment')().year()
const GATE = 1

let sessionCookie = null
let server = null

experiment('File upload: ', () => {
  lab.before(async () => {
    process.env.CONTEXT = 'FMT'
    server = await minimalServer()
    const response = await server.inject({ url: '/login', method: 'POST', payload: { user: FMTUSER, password: FMTPASS } })
    sessionCookie = Runner.getCookies(response)['sid']
  })

  const makeUpload = async (year, gate, file) => {
    const form = new FormData()
    form.append('year', year)
    form.append('gate', gate)
    form.append('upload', Fs.createReadStream(file))
    const headers = form.getHeaders()
    Object.assign(headers, { cookie: 'sid=' + sessionCookie })
    const payload = await StreamToPromise(form)
    const response = await server.inject({ url: '/age-weight-key', method: 'POST', payload: payload, headers: headers })
    return response
  }

  const makeConflictDecision = async (decision) => {
    const form = new FormData()
    form.append('overwrite', decision)
    const headers = form.getHeaders()
    Object.assign(headers, { cookie: 'sid=' + sessionCookie })
    const payload = await StreamToPromise(form)
    const response = await server.inject({ url: '/age-weight-key-conflict-check', method: 'POST', payload: payload, headers: headers })
    return response
  }

  test('Visit the age weight key page', async () => {
    const response = await server.inject({ url: '/age-weight-key', method: 'GET', headers: { cookie: 'sid=' + sessionCookie } })
    expect(response.statusCode).to.equal(200)
    expect(response.request.path).to.equal('/age-weight-key')
  })

  test('No gate selected', async () => {
    const response = await makeUpload(YEAR, '', VALID_FILE)
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/age-weight-key')
  })

  test('No year entered', async () => {
    const responseB = await makeUpload('', GATE, VALID_FILE)
    expect(responseB.statusCode).to.equal(302)
    expect(responseB.headers.location).to.equal('/age-weight-key')
  })

  test('Non-number entered as a year', async () => {
    const response = await makeUpload('non-numberic characters', GATE, VALID_FILE)
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/age-weight-key')
  })

  test('Year entered is out of range', async () => {
    const response = await makeUpload(1970, GATE, VALID_FILE)
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/age-weight-key')
  })

  test('No file selected', async () => {
    const form = new FormData()
    form.append('year', YEAR)
    form.append('gate', GATE)
    const headers = form.getHeaders()
    Object.assign(headers, { cookie: 'sid=' + sessionCookie })
    const payload = await StreamToPromise(form)
    const response = await server.inject({ url: '/age-weight-key', method: 'POST', payload: payload, headers: headers })

    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/age-weight-key')
  })

  test('Duplicate header', async () => {
    const responseA = await makeUpload(YEAR, GATE, DUPLICATE_HEADER)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key')

    const responseB = await server.inject({ url: '/age-weight-key-error-breakdown', method: 'GET', headers: { cookie: 'sid=' + sessionCookie } })
    expect(responseB.statusCode).to.equal(200)
    expect(responseB.request.path).to.equal('/age-weight-key-error-breakdown')
  })

  test('An empty file', async () => {
    const response = await makeUpload(YEAR, GATE, EMPTY_FILE)
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/age-weight-key')
  })

  test('Invalid format', async () => {
    const responseA = await makeUpload(YEAR, GATE, INVALID_FORMAT)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key')

    const responseB = await server.inject({ url: '/age-weight-key-error-breakdown', method: 'GET', headers: { cookie: 'sid=' + sessionCookie } })
    expect(responseB.statusCode).to.equal(200)
    expect(responseB.request.path).to.equal('/age-weight-key-error-breakdown')
  })

  test('Invalid header', async () => {
    const responseA = await makeUpload(YEAR, GATE, INVALID_HEADER)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key')

    const responseB = await server.inject({ url: '/age-weight-key-error-breakdown', method: 'GET', headers: { cookie: 'sid=' + sessionCookie } })
    expect(responseB.statusCode).to.equal(200)
    expect(responseB.request.path).to.equal('/age-weight-key-error-breakdown')
  })

  test('File too large', async () => {
    const response = await makeUpload(YEAR, GATE, LARGE_UPLOAD_FILE)
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/age-weight-key')
  })

  test('Missing column', async () => {
    const responseA = await makeUpload(YEAR, GATE, MISSING_COLUMN)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key')

    const responseB = await server.inject({ url: '/age-weight-key-error-breakdown', method: 'GET', headers: { cookie: 'sid=' + sessionCookie } })
    expect(responseB.statusCode).to.equal(200)
    expect(responseB.request.path).to.equal('/age-weight-key-error-breakdown')
  })

  test('Not a csv', async () => {
    const responseA = await makeUpload(YEAR, GATE, NOT_A_CSV)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key')
  })

  test('Viewing validation errors breakdown', async () => {
    const responseA = await makeUpload(YEAR, GATE, MIXED_ERRORS)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key')

    const responseB = await server.inject({ url: '/age-weight-key-error-breakdown', method: 'GET', headers: { cookie: 'sid=' + sessionCookie } })
    expect(responseB.statusCode).to.equal(200)
    expect(responseB.request.path).to.equal('/age-weight-key-error-breakdown')
  })

  test('Successful upload', async () => {
    const responseA = await makeUpload(YEAR - 2, GATE, VALID_FILE)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key-ok')

    const responseB = await server.inject({ url: '/age-weight-key-ok', method: 'GET', headers: { cookie: 'sid=' + sessionCookie } })
    expect(responseB.statusCode).to.equal(200)
    expect(responseB.request.path).to.equal('/age-weight-key-ok')
  })

  test('Conflicting upload (year already exists), continued without selection', async () => {
    await makeUpload(YEAR - 1, GATE, VALID_FILE)
    const responseA = await makeUpload(YEAR - 1, GATE, VALID_FILE)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key-conflict-check')

    const responseB = await server.inject({ url: '/age-weight-key-conflict-check', method: 'GET', headers: { cookie: 'sid=' + sessionCookie } })
    expect(responseB.statusCode).to.equal(200)
    expect(responseB.request.path).to.equal('/age-weight-key-conflict-check')

    const responseC = await makeConflictDecision('')
    expect(responseC.statusCode).to.equal(200)
    expect(responseC.request.path).to.equal('/age-weight-key-conflict-check')
  })

  test('Conflicting upload (year already exists), cancelled upload', async () => {
    await makeUpload(YEAR + 1, GATE, VALID_FILE)
    const responseA = await makeUpload(YEAR + 1, GATE, VALID_FILE)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key-conflict-check')

    const responseB = await makeConflictDecision('false')
    expect(responseB.statusCode).to.equal(302)
    expect(responseB.headers.location).to.equal('/age-weight-key')
  })

  test('Conflicting upload (year already exists), chose to overwrite', async () => {
    await makeUpload(YEAR + 2, GATE, VALID_FILE)
    const responseA = await makeUpload(YEAR + 2, GATE, VALID_FILE)
    expect(responseA.statusCode).to.equal(302)
    expect(responseA.headers.location).to.equal('/age-weight-key-conflict-check')

    const responseB = await makeConflictDecision('true')
    expect(responseB.statusCode).to.equal(302)
    expect(responseB.headers.location).to.equal('/age-weight-key-ok')
  })

  test('Cancel upload', async () => {
    const response = await server.inject({ url: '/age-weight-key-cancel', method: 'GET', headers: { cookie: 'sid=' + sessionCookie } })
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/licence')
  })
})
