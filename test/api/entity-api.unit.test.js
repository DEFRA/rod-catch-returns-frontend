const EntityApi = require('../../src/api/entity-api')

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
})
