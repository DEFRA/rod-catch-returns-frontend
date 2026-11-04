const moment = require('moment')
const validate = require('../../src/validators/age-weight-key')
const AgeWeightKeyApi = require('../../src/api/age-weight-key')
const ResponseError = require('../../src/handlers/response-error')

jest.mock('../../src/lib/logger-utils')
jest.mock('../../src/api/age-weight-key')
jest.mock('../../src/lib/antivirus')
jest.mock('fs')

describe('age-weight-key.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  const getMockRequest = (payload) => ({
    payload
  })

  it('adds NO_GATE_SELECTED when gate missing', async () => {
    const result = await validate(getMockRequest({ year: '2024', upload: {} }))

    expect(result).toContainEqual({ type: 'NO_GATE_SELECTED' })
  })

  it('adds NO_YEAR_ENTERED when year missing', async () => {
    const result = await validate(getMockRequest({ gate: 'A', upload: {} }))

    expect(result).toContainEqual({ type: 'NO_YEAR_ENTERED' })
  })

  it('adds NOT_A_REAL_YEAR when year is not numeric', async () => {
    const result = await validate(getMockRequest({ gate: 'A', year: 'abc', upload: {} }))

    expect(result).toContainEqual({ type: 'NOT_A_REAL_YEAR' })
  })

  it('adds YEAR_OUT_OF_RANGE when year not in ±2 range', async () => {
    const farYear = (moment().year() + 10).toString()

    const result = await validate(getMockRequest({ gate: 'A', year: farYear, upload: {} }))

    expect(result).toContainEqual({ type: 'YEAR_OUT_OF_RANGE' })
  })

  it('adds NO_FILE_SELECTED when upload missing', async () => {
    const result = await validate(getMockRequest({ gate: 'A', year: '2024' }))

    expect(result).toContainEqual({ type: 'NO_FILE_SELECTED' })
  })

  it('adds BAD_FILE_TYPE when not CSV', async () => {
    const result = await validate(getMockRequest({
      gate: 'A',
      year: '2024',
      upload: { filename: 'test.txt' }
    }))

    expect(result).toContainEqual({ type: 'BAD_FILE_TYPE' })
  })

  it('adds FILE_TOO_LARGE when bytes exceed limit', async () => {
    const result = await validate(getMockRequest({
      gate: 'A',
      year: '2024',
      upload: { filename: 'test.csv', bytes: 200000 }
    }))

    expect(result).toContainEqual({ type: 'FILE_TOO_LARGE' })
  })

  it('adds FILE_EMPTY when bytes = 0', async () => {
    const result = await validate(getMockRequest({
      gate: 'A',
      year: '2024',
      upload: { filename: 'test.csv', bytes: 0 }
    }))

    expect(result).toContainEqual({ type: 'FILE_EMPTY' })
  })

  it('sets scanner using clamdscan sockets when CLAMD_SOCK and CLAMD_PORT are set', async () => {
    process.env.CLAMD_SOCK = '/tmp/clam.sock'
    process.env.CLAMD_PORT = '3310'
    const { retryAntiVirusInit } = require('../../src/lib/antivirus')
    retryAntiVirusInit.mockResolvedValue({ get_version: jest.fn().mockResolvedValue('ClamAV 1.0') })
    require('../../src/validators/age-weight-key')

    await new Promise(process.nextTick)

    expect(retryAntiVirusInit).toHaveBeenCalledWith({
      clamdscan: {
        socket: '/tmp/clam.sock',
        port: '3310',
        local_fallback: false
      },
      preference: 'clamdscan'
    }, 5, 10000)
  })

  it('sets scanner using clamscan binary when CLAMD_SOCK and CLAMD_PORT are set', async () => {
    delete process.env.CLAMD_SOCK
    delete process.env.CLAMD_PORT
    const { retryAntiVirusInit } = require('../../src/lib/antivirus')
    retryAntiVirusInit.mockResolvedValue({ get_version: jest.fn().mockResolvedValue('ClamAV 1.0') })
    require('../../src/validators/age-weight-key')

    await new Promise(process.nextTick)

    expect(retryAntiVirusInit).toHaveBeenCalledWith({
      preference: 'clamscan'
    }, 5, 10000)
  })

  it('logs an error if no virus scanner is found', async () => {
    const { retryAntiVirusInit } = require('../../src/lib/antivirus')
    const logger = require('../../src/lib/logger-utils')
    retryAntiVirusInit.mockRejectedValueOnce(new Error('not found'))
    require('../../src/validators/age-weight-key')

    await new Promise(process.nextTick)

    expect(logger.error).toHaveBeenCalledWith('No virus scanner found; undefined will not be virus checked')
  })

  it('logs error when fs.chmod throws during scan', async () => {
    const chmodError = new Error('chmod failed')
    const Fs = require('fs')
    const logger = require('../../src/lib/logger-utils')
    const { retryAntiVirusInit } = require('../../src/lib/antivirus')
    const validate = require('../../src/validators/age-weight-key')

    Fs.chmod.mockImplementation((path, mode, cb) => {
      cb(chmodError)
    })

    retryAntiVirusInit.mockResolvedValue({
      is_infected: jest.fn().mockResolvedValue({ is_infected: false })
    })

    const request = {
      payload: {
        gate: 'A',
        year: moment().year().toString(),
        upload: {
          filename: 'test.csv',
          bytes: 10,
          path: '/tmp/file.csv'
        }
      }
    }

    await expect(validate(request)).rejects.toThrow()

    expect(logger.error).toHaveBeenCalledWith(chmodError)
  })

  it('calls scanner.is_infected with file path and returns its result', async () => {
    process.env.CLAMD_SOCK = '/tmp/clam.sock'
    process.env.CLAMD_PORT = '3310'
    const { retryAntiVirusInit } = require('../../src/lib/antivirus')
    const AgeWeightKeyApi = require('../../src/api/age-weight-key')
    AgeWeightKeyApi.postNew.mockResolvedValue({
      statusCode: 200
    })
    const isInfectedMock = jest.fn().mockResolvedValue({
      is_infected: false,
      file: 'test.csv',
      viruses: []
    })
    retryAntiVirusInit.mockResolvedValue({
      get_version: jest.fn().mockResolvedValue('ClamAV 1.0'),
      is_infected: isInfectedMock
    })

    const validate = require('../../src/validators/age-weight-key')
    const request = {
      payload: {
        gate: 'A',
        year: moment().year().toString(),
        upload: {
          filename: 'test.csv',
          bytes: 10,
          path: '/tmp/file.csv'
        }
      }
    }
    await new Promise(process.nextTick)

    const result = await validate(request)

    expect(isInfectedMock).toHaveBeenCalledWith('/tmp/file.csv')
    expect(result).toBeNull() // no virus, validation passes
  })

  it('returns validation errors when preValidate fails', async () => {
    const request = getMockRequest({
      gate: null,
      year: null,
      upload: null
    })

    const result = await validate(request)
    expect(result).toEqual([
      { type: 'NO_GATE_SELECTED' },
      { type: 'NO_YEAR_ENTERED' },
      { type: 'NO_FILE_SELECTED' }
    ])
  })

  it('returns FILE_HAS_VIRUS when scanner detects infection', async () => {
    const request = getMockRequest({
      gate: 'A',
      year: moment().year().toString(),
      upload: {
        filename: 'test.csv',
        bytes: 10,
        path: '/tmp/file.csv'
      },
      vmock: true
    })

    const result = await validate(request)

    expect(result).toEqual([{ type: 'FILE_HAS_VIRUS' }])
  })

  it('returns OVERWRITE_DISALLOWED when API returns conflict', async () => {
    AgeWeightKeyApi.postNew.mockResolvedValue({
      statusCode: ResponseError.status.CONFLICT
    })

    const request = getMockRequest({
      gate: 'A',
      year: moment().year().toString(),
      upload: {
        filename: 'test.csv',
        bytes: 10,
        path: '/tmp/file.csv'
      }
    })

    const result = await validate(request)

    expect(result).toEqual([{ type: 'OVERWRITE_DISALLOWED' }])
  })

  it('returns BAD_FILE + API errors when API returns BAD_REQUEST', async () => {
    AgeWeightKeyApi.postNew.mockResolvedValue({
      status: ResponseError.status.BAD_REQUEST,
      errors: [{ msg: 'bad row' }]
    })

    const request = getMockRequest({
      gate: 'A',
      year: moment().year().toString(),
      upload: {
        filename: 'test.csv',
        bytes: 10,
        path: '/tmp/file.csv'
      }
    })

    const result = await validate(request)

    expect(result).toEqual([
      { type: 'BAD_FILE' },
      { msg: 'bad row' }
    ])
  })

  it('returns null when everything succeeds', async () => {
    AgeWeightKeyApi.postNew.mockResolvedValue({
      statusCode: 200
    })

    const request = getMockRequest({
      gate: 'A',
      year: moment().year().toString(),
      upload: {
        filename: 'test.csv',
        bytes: 10,
        path: '/tmp/file.csv'
      }
    })

    const result = await validate(request)

    expect(result).toBeNull()
  })
})
