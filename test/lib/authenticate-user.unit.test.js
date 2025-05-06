const { v4: uuid } = require('uuid')
const Crypto = require('../../src/lib/crypto')

const authenticateUser = require('../../src/lib/authenticate-user')

jest.mock('uuid')
jest.mock('../../src/lib/crypto')

describe('authenticate-user', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('module.exports', () => {
    it('should throw an error if user is not authenticated', async () => {
      const request = {
        app: {}
      }

      await expect(authenticateUser(request)).rejects
        .toThrow(new Error('Cannot set up session cookie and cache for an unauthenticated user'))
    })

    it('should set the encrypted authorization details in the cache if it is a user authentication', async () => {
      const mockCacheSet = jest.fn(() => ({}))
      const mockCookieAuthSet = jest.fn(() => ({}))
      uuid.mockImplementation(() => 'testid')

      const request = {
        cache: jest.fn(() => ({
          set: mockCacheSet
        })),
        app: {
          authorization: {
            username: 'username'
          }
        },
        cookieAuth: {
          set: mockCookieAuthSet
        },
        server: {
          app: {
            cache: {}
          }
        }
      }

      await authenticateUser(request)

      expect(mockCookieAuthSet).toHaveBeenCalledWith({ sid: 'testid' })
      expect(Crypto.writeObj).toHaveBeenCalledTimes(1)
      expect(mockCacheSet).toHaveBeenCalledTimes(1)
    })

    it('should set set the contactId if the user is authenticated by the license', async () => {
      const mockCacheSet = jest.fn(() => ({}))
      const mockCookieAuthSet = jest.fn(() => ({}))
      uuid.mockImplementation(() => 'testid')

      const request = {
        cache: jest.fn(() => ({
          set: mockCacheSet
        })),
        app: {
          authorization: {
            contactId: '1234'
          }
        },
        cookieAuth: {
          set: mockCookieAuthSet
        },
        server: {
          app: {
            cache: {}
          }
        }
      }

      await authenticateUser(request)

      expect(mockCookieAuthSet).toHaveBeenCalledWith({ sid: 'testid' })
      expect(Crypto.writeObj).not.toHaveBeenCalled()
      expect(mockCacheSet).toHaveBeenCalledTimes(1)
      expect(mockCacheSet).toHaveBeenCalledWith({ contactId: '1234' })
    })
  })
})
