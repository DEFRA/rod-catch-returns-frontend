const licenceValidator = require('../../src/validators/licence')
const { parsePostcode, parseLicence, licenceSchema } = require('../../src/lib/licence-utils')
const LicenceApi = require('../../src/api/licence')

jest.mock('../../src/api/licence')
jest.mock('../../src/lib/licence-utils')

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
    const request = {
      payload: {
        licence: '123456',
        postcode: 'A9 9AA'
      }
    }
    const result = await licenceValidator(request)

    expect(result).toStrictEqual([{ licence: 'VALIDATION_ERROR' }])
  })

  it('should return NOT_FOUND if no contact is returned', async () => {
    parseLicence.mockReturnValueOnce('123456')
    parsePostcode.mockReturnValueOnce('A9 9AA')
    licenceSchema.validate.mockReturnValueOnce({ value: {} })
    LicenceApi.getContactFromLicenceKey.mockResolvedValueOnce(null)

    const request = { payload: { licence: '123456', postcode: 'A9 9AA' } }
    const result = await licenceValidator(request)

    expect(result).toStrictEqual([{ licence: 'NOT_FOUND' }])
  })

  it.each([
    ['NOT_FOUND', 404],
    ['FORBIDDEN', 403]
  ])('should return NOT_FOUND if API throws %s', async (_, statusCode) => {
    parseLicence.mockReturnValueOnce('123456')
    parsePostcode.mockReturnValueOnce('A9 9AA')
    licenceSchema.validate.mockReturnValueOnce({ value: {} })

    const error = new Error('API error')
    error.statusCode = statusCode
    LicenceApi.getContactFromLicenceKey.mockRejectedValueOnce(error)

    const request = { payload: { licence: '123456', postcode: 'A9 9AA' } }
    const result = await licenceValidator(request)

    expect(result).toStrictEqual([{ licence: 'NOT_FOUND' }])
  })

  it('should return null if validation and API call succeed', async () => {
    parseLicence.mockReturnValueOnce('123456')
    parsePostcode.mockReturnValueOnce('A9 9AA')
    licenceSchema.validate.mockReturnValueOnce({ value: {} })
    LicenceApi.getContactFromLicenceKey.mockResolvedValueOnce({ id: 'abc123' })

    const request = { payload: { licence: '123456', postcode: 'A9 9AA' } }
    const result = await licenceValidator(request)

    expect(result).toBeNull()
    expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', 'A9 9AA')
  })
})
