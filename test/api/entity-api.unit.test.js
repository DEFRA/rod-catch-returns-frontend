const EntityApi = require('../../src/api/entity-api')
const Client = require('../../src/api/client')

jest.mock('../../src/api/client')

describe('entity-api', () => {
  describe('getAuth', () => {
    const getMockRequest = (getValue) => ({
      cache: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(getValue)
      })
    })

    test('should return the authorization token when it exists in cache', async () => {
      const mockRequest = getMockRequest({
        authorization: {
          token: 'test-auth-token',
          name: 'test-user'
        }
      })

      const result = await EntityApi.getAuth(mockRequest)

      expect(result).toBe('test-auth-token')
    })

    test('should return null when authorization does not exist in cache', async () => {
      const mockRequest = getMockRequest({})

      const result = await EntityApi.getAuth(mockRequest)

      expect(result).toBeNull()
    })
  })

  describe('keyFromLink', () => {
    it('should extract the key from a url', () => {
      const mockRequest = {
        _links: {
          self: {
            href: 'http://localhost:5000/api/submissions/678'
          }
        }
      }
      const result = EntityApi.keyFromLink(mockRequest)

      expect(result).toBe('submissions/678')
    })
  })

  describe('add', () => {
    it('should call Client.request with POST and set id if no errors', async () => {
      const mockToken = 'test-token'
      const mockRequest = {
        cache: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            authorization: { token: mockToken, name: 'Test User' }
          })
        })
      }
      const entityApi = new EntityApi('submissions')
      const mockResponse = {
        _links: { self: { href: 'http://localhost:5000/api/submissions/1' } }
      }
      Client.request.mockResolvedValue(mockResponse)

      const result = await entityApi.add(mockRequest, { name: 'Test' })

      expect(Client.request).toHaveBeenCalledWith(
        mockToken,
        'POST',
        'submissions',
        null,
        { name: 'Test' }
      )
      expect(result.id).toBe('submissions/1')
    })
  })

  it('should return result with errors, if there are any errors', async () => {
    const mockToken = 'test-token'
    const entityApi = new EntityApi('submissions')
    const mockResponse = { errors: ['Bad Request'] }
    const mockRequest = {
      cache: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          authorization: { token: mockToken, name: 'Test User' }
        })
      })
    }
    Client.request.mockResolvedValue(mockResponse)

    const result = await entityApi.add(mockRequest, { invalid: true })

    expect(result).toEqual(mockResponse)
  })
})
