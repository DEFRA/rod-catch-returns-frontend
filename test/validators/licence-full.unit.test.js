const logger = require('../../src/lib/logger-utils')

const licenceFullValidator = require('../../src/validators/licence-full')
const LicenceApi = require('../../src/api/licence')
const ResponseError = require('../../src/handlers/response-error')

jest.mock('../../src/lib/logger-utils')
jest.mock('../../src/api/licence')

describe('licence-full', () => {
  beforeEach(() => {
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

    it('should return an error if the licence number is not the correct format', async () => {
      const request = {
        payload: {
          licenceNumber: '123`sdkl`dhie&'
        }
      }
      const result = await licenceFullValidator(request)
      expect(result).toStrictEqual([{ licenceNumber: 'BAD_REQUEST' }])
    })

    it('should return an error if the licence number could not be found through the api', async () => {
      const request = {
        payload: {
          licenceNumber: '123-123'
        }
      }
      LicenceApi.getContactFromFullLicenceNumber.mockImplementationOnce(() => {})
      const result = await licenceFullValidator(request)
      expect(result).toStrictEqual([{ licenceNumber: 'NOT_FOUND' }])
    })

    it('should return an error if the api throws a 404 error', async () => {
      const request = {
        payload: {
          licenceNumber: '123-123'
        }
      }
      LicenceApi.getContactFromFullLicenceNumber.mockImplementationOnce(
        () => Promise.reject(new ResponseError.Error('Error', ResponseError.status.NOT_FOUND)))

      const result = await licenceFullValidator(request)
      expect(result).toStrictEqual([{ licenceNumber: 'NOT_FOUND' }])
    })

    it('should return and log the error if the api throws a 500', async () => {
      const request = {
        payload: {
          licenceNumber: '123-123'
        }
      }
      LicenceApi.getContactFromFullLicenceNumber.mockImplementationOnce(
        () => Promise.reject(new ResponseError.Error('Error', 500)))

      const result = await licenceFullValidator(request)
      expect(result).toStrictEqual([{ licenceNumber: 'NOT_FOUND' }])
      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    it('should return no error if the contact details are retrieved from the api', async () => {
      const request = {
        payload: {
          licenceNumber: '123-123'
        }
      }
      LicenceApi.getContactFromFullLicenceNumber.mockImplementationOnce(() => ({ licence: { contact: { id: '123' } } }))
      const result = await licenceFullValidator(request)
      expect(result).toBeNull()
    })
  })
})
