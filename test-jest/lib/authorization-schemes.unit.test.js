const Client = require('../../src/api/client')
const LicenceApi = require('../../src/api/licence')
const ResponseError = require('../../src/handlers/response-error')

const authorizationSchemes = require('../../src/lib/authorization-schemes')

jest.mock('../../src/api/client')
jest.mock('../../src/api/licence')

describe('authorization-schemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('activeDirScheme', () => {
    it('should return options field', async () => {
      expect(authorizationSchemes.activeDirScheme().options).toEqual({ payload: true })
    })

    describe('payload', () => {
      it('should return h.continue if user is not present', async () => {
        const request = {
          payload: {
            password: 'password'
          }
        }
        const h = {
          continue: 'response'
        }

        await expect(authorizationSchemes.activeDirScheme().payload(request, h)).resolves.toEqual('response')

        expect(Client.request).not.toHaveBeenCalled()
      })

      it('should return h.continue if password is not present', async () => {
        const request = {
          payload: {
            user: 'user'
          }
        }
        const h = {
          continue: 'response'
        }

        await expect(authorizationSchemes.activeDirScheme().payload(request, h)).resolves.toEqual('response')

        expect(Client.request).not.toHaveBeenCalled()
      })

      it('should return h.continue and calls Client.request if call is successful', async () => {
        const request = {
          payload: {
            user: 'user@mail.com',
            password: 'password'
          }
        }
        const h = {
          continue: 'response'
        }
        Client.request.mockImplementation(() => {})

        await expect(authorizationSchemes.activeDirScheme().payload(request, h)).resolves.toEqual('response')

        const auth = {
          username: 'user@mail.com',
          password: 'password'
        }
        expect(Client.request).toHaveBeenCalled()
        expect(Client.request).toHaveBeenCalledWith(auth, 'GET', 'profile')
        expect(request.app.authorization).toEqual(auth)
      })

      it('should return an error and auth should not be present if Client.request call fails', async () => {
        const request = {
          payload: {
            user: 'user@mail.com',
            password: 'password'
          },
          app: {}
        }
        const h = {
          continue: 'response'
        }
        Client.request.mockImplementation(() => {
          throw new Error()
        })

        await expect(authorizationSchemes.activeDirScheme().payload(request, h)).rejects

        const auth = {
          username: 'user@mail.com',
          password: 'password'
        }
        expect(Client.request).toHaveBeenCalled()
        expect(Client.request).toHaveBeenCalledWith(auth, 'GET', 'profile')
        expect(request.app.authorization).toBeUndefined()
      })

      it('should return h.continue and auth should not be present if Client.request call fails with a statusCode beginning with 4', async () => {
        const request = {
          payload: {
            user: 'user@mail.com',
            password: 'password'
          },
          app: {}
        }
        const h = {
          continue: 'response'
        }
        Client.request.mockImplementation(() => {
          throw new ResponseError.Error('Error', ResponseError.status.UNAUTHORIZED)
        })

        await expect(authorizationSchemes.activeDirScheme().payload(request, h)).resolves.toEqual('response')

        const auth = {
          username: 'user@mail.com',
          password: 'password'
        }
        expect(Client.request).toHaveBeenCalled()
        expect(Client.request).toHaveBeenCalledWith(auth, 'GET', 'profile')
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

        await expect(authorizationSchemes.activeDirScheme().authenticate(request, h)).resolves.toEqual('response')
      })
    })
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

      it('should return h.continue and calls LicenceApi.getContactFromLicenceKey if call is successful', async () => {
        const request = getMockLicenceRequest()
        const contactResponse = {
          contact: {
            id: '12345'
          }
        }
        LicenceApi.getContactFromLicenceKey.mockImplementation(() => contactResponse)

        await expect(authorizationSchemes.licenceScheme().payload(request, getMockH())).resolves.toEqual('response')

        expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', 'AB12 3CD')
        expect(request.app.authorization.contactId).toEqual('12345')
      })

      it('should return an error and auth should not be present if LicenceApi.getContactFromLicenceKey call fails', async () => {
        const request = getMockLicenceRequest()
        LicenceApi.getContactFromLicenceKey.mockImplementation(() => {
          throw new Error()
        })

        await expect(authorizationSchemes.licenceScheme().payload(request, getMockH())).rejects

        expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', 'AB12 3CD')
        expect(request.app.authorization).toBeUndefined()
      })

      it('should return h.continue and auth should not be present if LicenceApi.getContactFromLicenceKey call fails with a statusCode beginning with 4', async () => {
        const request = getMockLicenceRequest()
        LicenceApi.getContactFromLicenceKey.mockImplementation(() => {
          throw new ResponseError.Error('Error', ResponseError.status.UNAUTHORIZED)
        })

        await expect(authorizationSchemes.licenceScheme().payload(request, getMockH())).resolves.toEqual('response')

        expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', 'AB12 3CD')
        expect(request.app.authorization).toBeUndefined()
      })

      it.each([
        ['ba21nw', 'BA2 1NW'],
        [' AB12    3CD ', 'AB12 3CD'],
        ['AB123CD ', 'AB12 3CD'],
        ['A99AA', 'A9 9AA']
      ])('formats the UK postcode %s successfully as %s', async (postcode, replacedValue) => {
        const request = getMockLicenceRequest(postcode)

        await authorizationSchemes.licenceScheme().payload(request, getMockH())

        expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', replacedValue)
      })

      it.each([
        ['BS1 5AH'],
        ['WA4 1HT'],
        ['NE4 7AR'],
        ['A9 9AA']
      ])('does not change the format of the UK postcode %s', async (postcode) => {
        const request = getMockLicenceRequest(postcode)

        await authorizationSchemes.licenceScheme().payload(request, getMockH())

        expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', postcode)
      })

      it.each([
        ['22041'],
        ['D24 CK66'],
        ['6011']
      ])('does not change the format of the non-UK postcode %s', async (postcode) => {
        const request = getMockLicenceRequest(postcode)

        await authorizationSchemes.licenceScheme().payload(request, getMockH())

        expect(LicenceApi.getContactFromLicenceKey).toHaveBeenCalledWith(request, '123456', postcode)
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

  const getMockLicenceRequest = (postcode = 'AB12 3CD') => ({
    payload: {
      licence: '123456',
      postcode
    },
    app: {}
  })

  const getMockH = () => ({
    continue: 'response'
  })
})
