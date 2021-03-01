const licenceFullValidator = require('../../src/validators/licence-full')
const LicenceApi = require('../../src/api/licence')
const ResponseError = require('../../src/handlers/response-error')

jest.mock('../../src/api/licence')

describe('licence-full', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('default', () => {
    it('should return an error if the licence number is empty', async () => {
      const request = {
        payload: ''
      }
      const result = await licenceFullValidator(request)
      expect(result).toStrictEqual([{ licenceNumber: 'EMPTY' }])
    })

    it('should return an error if the licence number could not be found through the api', async () => {
      const request = {
        payload: {
          licenceNumber: '123'
        }
      }
      LicenceApi.getContactFromFullLicenceNumber.mockImplementationOnce(() => {})
      const result = await licenceFullValidator(request)
      expect(result).toStrictEqual([{ licenceNumber: 'NOT_FOUND' }])
    })

    it('should return an error if the api throws an error', async () => {
      const request = {
        payload: {
          licenceNumber: '123'
        }
      }
      LicenceApi.getContactFromFullLicenceNumber.mockImplementationOnce(
        () => Promise.reject(new ResponseError.Error('Error', ResponseError.status.NOT_FOUND)))

      const result = await licenceFullValidator(request)
      expect(result).toStrictEqual([{ licenceNumber: 'NOT_FOUND' }])
    })

    it('should return no errore if the contact details are retrieved from the api', async () => {
      const request = {
        payload: {
          licenceNumber: '123'
        }
      }
      LicenceApi.getContactFromFullLicenceNumber.mockImplementationOnce(() => ({ licence: { contact: { id: '123' } } }))
      const result = await licenceFullValidator(request)
      expect(result).toBeNull()
    })
  })
})
