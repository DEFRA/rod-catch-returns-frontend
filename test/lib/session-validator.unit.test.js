const { validateSession } = require('../../src/lib/session-validator')

describe('validateSession', () => {
  const getMockRequest = ({
    cachGetValue = undefined
  } = {}) => ({
    server: {
      app: {
        cache: {
          get: jest.fn().mockResolvedValue(cachGetValue)
        }
      }
    }
  })

  it('returns valid: true and credentials if session exists in cache', async () => {
    const cachedData = {
      authorization: { userId: 'user-1', role: 'admin' }
    }
    const mockRequest = getMockRequest({ cachGetValue: cachedData })

    const result = await validateSession(mockRequest, { session: 'abc123' })

    expect(result).toEqual({
      valid: true,
      credentials: cachedData.authorization
    })
  })

  it('returns valid: false if session is not found in cache', async () => {
    const mockRequest = getMockRequest({ cachGetValue: null })

    const result = await validateSession(mockRequest, { session: 'abc123' })

    expect(result).toEqual({
      valid: false
    })
  })
})
