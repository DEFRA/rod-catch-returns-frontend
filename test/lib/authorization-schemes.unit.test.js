const LicenceApi = require('../../src/api/licence')
const ResponseError = require('../../src/handlers/response-error')
const { parsePostcode, parseLicence, licenceSchema } = require('../../src/lib/licence-utils')
const { getMockH } = require('../test-utils/server-test-utils')

const authorizationSchemes = require('../../src/lib/authorization-schemes')

jest.mock('../../src/api/licence')
jest.mock('../../src/lib/licence-utils')

const getMockLicenceRequest = ({ postcode = 'AB12 3CD', licence = '123456' } = {}) => ({
  payload: {
    licence,
    postcode
  },
  app: {}
})

const setupMocks = ({
  postcode = 'AB12 3CD',
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

describe('authorization-schemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('licenceScheme', () => {
    it('should return options field', async () => {
      expect(authorizationSchemes.licenceScheme().options).toEqual({ payload: true })
    })

    describe('payload', () => {
      it('should return h.continue if licence is not present', async () => {
        const request = {
          payload: {
            postcode: 'postcode'
          }
        }

        await expect(authorizationSchemes.licenceScheme().payload(request, getMockH())).resolves.toEqual('response')

        expect(LicenceApi.getContactFromLicenceKey).not.toHaveBeenCalled()
      })

      it('should return h.postcode if postcode is not present', async () => {
        const request = {
          payload: {
            licence: 'licence'
          }
        }

        await expect(authorizationSchemes.licenceScheme().payload(request, getMockH())).resolves.toEqual('response')

        expect(LicenceApi.getContactFromLicenceKey).not.toHaveBeenCalled()
      })

      it('should return h.continue and auth should not be present if licence schema fails to validate', async () => {
        const request = getMockLicenceRequest()
        setupMocks({ licenceSchemaResponse: { error: 'error' } })

        await expect(authorizationSchemes.licenceScheme().payload(request, getMockH())).resolves.toEqual('response')

        expect(LicenceApi.getContactFromLicenceKey).not.toHaveBeenCalled()
        expect(request.app.authorization).toBeUndefined()
      })

      it('should return h.continue and calls LicenceApi.getContactFromLicenceKey if call is successful', async () => {
        const request = getMockLicenceRequest()
        setupMocks()

        await expect(authorizationSchemes.licenceScheme().payload(request, getMockH())).resolves.toEqual('response')

        expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', 'AB12 3CD')
        expect(request.app.authorization.contactId).toEqual('12345')
      })

      it('should return an error and auth should not be present if LicenceApi.getContactFromLicenceKey call fails', async () => {
        const request = getMockLicenceRequest()
        const error = new Error('error')
        setupMocks({
          licenceApiResponse: () => {
            throw error
          }
        })
        await expect(authorizationSchemes.licenceScheme().payload(request, getMockH())).rejects.toEqual(error)

        expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', 'AB12 3CD')
        expect(request.app.authorization).toBeUndefined()
      })

      it('should return h.continue and auth should not be present if LicenceApi.getContactFromLicenceKey call fails with a statusCode beginning with 4', async () => {
        const request = getMockLicenceRequest()
        setupMocks({
          licenceApiResponse: () => {
            throw new ResponseError.Error('Error', ResponseError.status.UNAUTHORIZED)
          }
        })

        await expect(authorizationSchemes.licenceScheme().payload(request, getMockH())).resolves.toEqual('response')

        expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', 'AB12 3CD')
        expect(request.app.authorization).toBeUndefined()
      })
    })

    describe('authenticate', () => {
      it('should return h.authenticated', async () => {
        const request = {
          payload: {
            password: 'password'
          }
        }
        const h = {
          authenticated: jest.fn(() => 'response')
        }
        await expect(authorizationSchemes.licenceScheme().authenticate(request, h)).resolves.toEqual('response')
      })
    })
  })
})
