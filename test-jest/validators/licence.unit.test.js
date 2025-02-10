const licenceValidator = require('../../src/validators/licence')
const LicenceApi = require('../../src/api/licence')

jest.mock('../../src/api/licence')

describe('licence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['ba21nw', 'BA2 1NW'],
    [' AB12    3CD ', 'AB12 3CD'],
    ['AB123CD ', 'AB12 3CD']
  ])('formats the UK postcode %s successfully as %s', async (postcode, replacedValue) => {
    const request = {
      payload: {
        licence: '123-123',
        postcode
      }
    }

    await licenceValidator(request)

    expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123-123', replacedValue)
  })

  it.each([
    ['BS1 5AH'],
    ['WA4 1HT'],
    ['NE4 7AR']
  ])('does not change the format of the UK postcode %s', async (postcode) => {
    const request = {
      payload: {
        licence: '123-123',
        postcode
      }
    }

    await licenceValidator(request)

    expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123-123', postcode)
  })

  it.each([
    ['22041'],
    ['D24 CK66'],
    ['6011']
  ])('does not change the format of the non-UK postcode %s', async (postcode) => {
    const request = {
      payload: {
        licence: '123-123',
        postcode
      }
    }

    await licenceValidator(request)

    expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123-123', postcode)
  })
})
