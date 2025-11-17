const licenceValidator = require('../../src/validators/licence')
const ResponseError = require('../../src/handlers/response-error')
const { parsePostcode, parseLicence, licenceSchema } = require('../../src/lib/licence-utils')
const LicenceApi = require('../../src/api/licence')
const logger = require('../../src/lib/logger-utils')

jest.mock('../../src/api/licence')
jest.mock('../../src/lib/licence-utils')
jest.mock('../../src/lib/logger-utils')

const getMockRequest = ({ postcode = 'A9 9AA', licence = '123456' } = {}) => ({
  payload: {
    licence,
    postcode
  },
  app: {}
})

const setupMocks = ({
  postcode = 'A9 9AA',
  licence = '123456',
  licenceApiResponse = () => ({
    contact: {
      id: '12345'
    }
  }),
  licenceSchemaResponse = { value: {} }
} = {}) => {
  parsePostcode.mockReturnValueOnce(postcode)
  parseLicence.mockReturnValueOnce(licence)
  LicenceApi.getContactFromLicenceKey.mockImplementation(licenceApiResponse)
  licenceSchema.validate.mockReturnValueOnce(licenceSchemaResponse)
}

describe('licence.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return EMPTY if license is not provided in the payload', async () => {
    const request = {
      payload: {
        postcode: 'A9 9AA'
      }
    }
    const result = await licenceValidator(request)

    expect(result).toStrictEqual([{ licence: 'EMPTY' }])
  })

  it('should return EMPTY if postcode is not provided in the payload', async () => {
    const request = {
      payload: {
        licence: '123456'
      }
    }
    const result = await licenceValidator(request)

    expect(result).toStrictEqual([{ postcode: 'EMPTY' }])
  })

  it('should return VALIDATION_ERROR if there is an error with the validation', async () => {
    licenceSchema.validate.mockReturnValueOnce({ error: 'error' })
    const result = await licenceValidator(getMockRequest())

    expect(result).toStrictEqual([{ licence: 'VALIDATION_ERROR' }])
  })

  it('should return NOT_FOUND if no contact is returned', async () => {
    setupMocks({
      licenceApiResponse: null
    })

    const result = await licenceValidator(getMockRequest())

    expect(result).toStrictEqual([{ licence: 'NOT_FOUND' }])
  })

  it.each([
    ['NOT_FOUND', 404],
    ['FORBIDDEN', 403]
  ])('should return NOT_FOUND if API throws %s', async (_, statusCode) => {
    setupMocks({
      licenceApiResponse: () => {
        throw new ResponseError.Error('Error', statusCode)
      }
    })

    const result = await licenceValidator(getMockRequest())

    expect(result).toStrictEqual([{ licence: 'NOT_FOUND' }])
  })

  it('should log and return null if API throws any other error', async () => {
    setupMocks({
      licenceApiResponse: () => {
        throw new ResponseError.Error('Error', 500)
      }
    })

    const result = await licenceValidator(getMockRequest())

    expect(result).toBe(null)
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('should return null if validation and API call succeed', async () => {
    setupMocks()

    const request = getMockRequest()
    const result = await licenceValidator(request)

    expect(result).toBeNull()
    expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', 'A9 9AA')
  })
})
