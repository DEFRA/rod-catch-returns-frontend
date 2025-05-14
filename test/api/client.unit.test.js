const mockRequest = jest.fn((options, callback) => {
  const response = { statusCode: 200 }
  const body = JSON.stringify({ success: true })
  callback(null, response, body)
})

const Client = require('../../src/api/client')

jest.mock('request-etag', () => {
  return jest.fn().mockImplementation(() => {
    return mockRequest
  })
})

describe('client', () => {
  beforeEach(jest.clearAllMocks)

  describe('request', () => {
    it('should add a token to the request header if it is passed in', async () => {
      const token = 'abc123'

      await Client.request(token, Client.method.GET, 'profile')

      expect(mockRequest).toHaveBeenCalledWith(
        {
          uri: expect.any(String),
          method: Client.method.GET,
          timeout: 60000,
          json: false,
          headers: {
            'Content-Type': 'application/json',
            token: token
          }
        },
        expect.any(Function)
      )
    })

    it('should not add a token to the request header if it is not passed in', async () => {
      await Client.request(undefined, Client.method.GET, 'profile')

      expect(mockRequest).toHaveBeenCalledWith(
        {
          uri: expect.any(String),
          method: Client.method.GET,
          timeout: 60000,
          json: false,
          headers: {
            'Content-Type': 'application/json'
          }
        },
        expect.any(Function)
      )
    })
  })
})
