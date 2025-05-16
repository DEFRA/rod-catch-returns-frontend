const mockRequest = jest.fn((options, callback) => {
  const response = { statusCode: 200 }
  const body = JSON.stringify({ success: true })
  callback(null, response, body)
})

const Client = require('../../src/api/client')
const ResponseError = require('../../src/handlers/response-error')

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
          timeout: expect.any(Number),
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
          timeout: expect.any(Number),
          json: false,
          headers: {
            'Content-Type': 'application/json'
          }
        },
        expect.any(Function)
      )
    })

    it('should reject with ResponseError on server error with response body', async () => {
      const errorResponse = { message: 'Internal Server Error' }
      const response = {
        statusCode: 500,
        statusMessage: 'Internal Server Error'
      }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, JSON.stringify(errorResponse))
      })

      await expect(Client.request(undefined, Client.method.GET, 'profile')).rejects.toStrictEqual(
        new ResponseError.Error('Internal Server Error', 500, errorResponse)
      )
    })

    it('should reject with ResponseError on server error without response body', async () => {
      const response = {
        statusCode: 500,
        statusMessage: 'Internal Server Error'
      }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, undefined)
      })

      await expect(Client.request(undefined, Client.method.GET, 'profile')).rejects.toStrictEqual(
        new ResponseError.Error('Internal Server Error', 500, {})
      )
    })
  })
})
