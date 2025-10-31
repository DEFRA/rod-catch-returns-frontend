const LicenceApi = require('../../src/api/licence')
const Client = require('../../src/api/client')

jest.mock('../../src/api/client')

describe('licence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getContactFromLicenceKey', () => {
    it('should call Client.request with correct parameters', async () => {
      const mockResponse = {
        licenceNumber: '11100420-2WT1SFT-B7A111',
        contact: {
          id: '123456',
          postcode: 'AB12CD'
        }
      }
      Client.request.mockResolvedValue(mockResponse)

      await LicenceApi.getContactFromLicenceKey({}, 'B7A111', 'AB12CD')

      expect(Client.request).toHaveBeenCalledWith(
        null,
        'GET',
        'licence/B7A111',
        'verification=AB12CD',
        null,
        true
      )
    })

    it('should return the response from getContactFromLicenceKey', async () => {
      const mockResponse = {
        licenceNumber: '11100420-2WT1SFT-B7A111',
        contact: {
          id: '123456',
          postcode: 'AB12CD'
        }
      }
      Client.request.mockResolvedValue(mockResponse)

      const request = {}
      const result = await LicenceApi.getContactFromLicenceKey(request, 'B7A111', 'AB12CD')

      expect(result).toEqual(mockResponse)
    })
  })

  describe('getContactFromFullLicenceNumber', () => {
    it('should call Client.request with correct parameters', async () => {
      const mockResponse = {
        licenceNumber: '11100420-2WT1SFT-B7A111',
        contact: {
          id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
          fullName: 'Brenin'
        }
      }
      Client.request.mockResolvedValue(mockResponse)

      await LicenceApi.getContactFromFullLicenceNumber({}, '11100420-2WT1SFT-B7A111')

      expect(Client.request).toHaveBeenCalledWith(
        null,
        'GET',
        'licence/full/11100420-2WT1SFT-B7A111',
        null,
        null,
        true
      )
    })

    it('should return the response from getContactFromFullLicenceNumber', async () => {
      const mockResponse = {
        licenceNumber: '11100420-2WT1SFT-B7A111',
        contact: {
          id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
          fullName: 'Brenin'
        }
      }
      Client.request.mockResolvedValue(mockResponse)

      const result = await LicenceApi.getContactFromFullLicenceNumber({}, '11100420-2WT1SFT-B7A111')

      expect(result).toEqual(mockResponse)
    })
  })
})
