const mockRequest = jest.fn((options, callback) => {
  const response = { statusCode: 200 }
  const body = JSON.stringify({ success: true })
  callback(null, response, body)
})

const Client = require('../../src/api/client')
const ResponseError = require('../../src/handlers/response-error')
const { logger } = require('defra-logging-facade')

jest.mock('request-etag', () => {
  return jest.fn().mockImplementation(() => {
    return mockRequest
  })
})
jest.mock('defra-logging-facade')
jest.mock('fs')

describe('client', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

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

    it('should set the url correctly', async () => {
      await Client.request(undefined, Client.method.GET, 'profile')

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'http://localhost:5000/api/profile'
        }),
        expect.any(Function)
      )
    })

    it('should set the url correctly, if no path is specified', async () => {
      await Client.request(undefined, Client.method.GET, '')

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'http://localhost:5000/api'
        }),
        expect.any(Function)
      )
    })

    it('should set the search paramter', async () => {
      await Client.request(undefined, Client.method.GET, 'getByContactIdAndSeason', 'contact_id=123&season=2025')

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'http://localhost:5000/api/getByContactIdAndSeason?contact_id=123&season=2025'
        }),
        expect.any(Function)
      )
    })

    it('should resolve successfully when response status is 304', async () => {
      const response = { statusCode: 304, statusMessage: 'Not Modified' }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, JSON.stringify({ cached: true }))
      })

      await expect(Client.request(undefined, Client.method.GET, 'cached-resource'))
        .resolves.toEqual({ cached: true })
    })

    it('should resolve with undefined when 404 and throwOnNotFound is false', async () => {
      const response = { statusCode: 404, statusMessage: 'Not Found' }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, '')
      })

      await expect(Client.request(undefined, Client.method.GET, 'missing-resource'))
        .resolves.toBeUndefined()
    })

    it('should reject with ResponseError when 404 and throwOnNotFound is true', async () => {
      const response = { statusCode: 404, statusMessage: 'Not Found' }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, '')
      })

      await expect(Client.request(undefined, Client.method.GET, 'missing-resource', undefined, undefined, true))
        .rejects.toStrictEqual(
          new ResponseError.Error('Not Found', 404)
        )
    })

    it('should resolve with status info when 409 Conflict occurs', async () => {
      const response = { statusCode: 409, statusMessage: 'Conflict' }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, '')
      })

      await expect(Client.request(undefined, Client.method.POST, 'create-duplicate'))
        .resolves.toEqual({
          statusCode: 409,
          statusMessage: 'Conflict'
        })
    })

    it('should resolve with the body when 400 Bad Request contains validation errors', async () => {
      const response = { statusCode: 400, statusMessage: 'Bad Request' }
      const errorBody = { errors: [{ field: 'name', message: 'Required' }] }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, JSON.stringify(errorBody))
      })

      await expect(Client.request(undefined, Client.method.POST, 'invalid-payload'))
        .resolves.toEqual(errorBody)
    })

    it('should reject with ResponseError when 400 Bad Request does not contain errors', async () => {
      const response = { statusCode: 400, statusMessage: 'Bad Request' }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, JSON.stringify({}))
      })

      await expect(Client.request(undefined, Client.method.POST, 'invalid-payload'))
        .rejects.toStrictEqual(
          new ResponseError.Error('Bad Request', 400)
        )
    })

    it('should reject when the request itself fails (network or request-etag error)', async () => {
      const error = 'Network error'
      mockRequest.mockImplementationOnce((options, callback) => {
        callback(error, null, null)
      })

      await expect(Client.request(undefined, Client.method.GET, 'unstable-endpoint'))
        .rejects.toThrow(error)
    })

    it('should log and rethrow an error if createRequest fails due to invalid base URL', async () => {
      process.env.JS_API_URL = 'invalid-url'

      await expect(
        Client.request(undefined, Client.method.GET, 'profile')
      ).rejects.toThrow(/Invalid URL/)

      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    it('should stringify the body when a JSON payload is provided', async () => {
      const payload = { name: 'test', value: 123 }

      await Client.request(undefined, Client.method.POST, 'create', undefined, payload)

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: JSON.stringify(payload)
        }),
        expect.any(Function)
      )
    })

    it('should not set body when no payload is provided', async () => {
      await Client.request(undefined, Client.method.GET, 'profile')

      expect(mockRequest).toHaveBeenCalledWith(
        expect.not.objectContaining({ body: expect.anything() }),
        expect.any(Function)
      )
    })
  })

  describe('requestAssociationChange', () => {
    it('should call ETagRequest with the correct parameters', async () => {
      const payload = 'entity1'

      await Client.requestAssociationChange('12345', 'link-path', payload)

      expect(mockRequest).toHaveBeenCalledWith(
        {
          body: 'entity1',
          headers: {
            'Content-Type': 'text/uri-list',
            token: '12345'
          },
          json: false,
          method: 'PUT',
          timeout: expect.any(Number),
          uri: expect.stringContaining('/link-path')
        },
        expect.any(Function)
      )
    })

    it('should propagate errors from ETagRequest', async () => {
      const response = { statusCode: 500, statusMessage: 'association change failed' }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, JSON.stringify({}))
      })

      await expect(
        Client.requestAssociationChange('12345', 'link-path', 'body')
      ).rejects.toThrow('association change failed')
    })
  })

  describe('requestFromLink', () => {
    it('should call ETagRequest with the GET method and return its result', async () => {
      await Client.requestFromLink('12345', 'link/to/resource')

      expect(mockRequest).toHaveBeenCalledWith(
        {
          headers: {
            'Content-Type': 'application/json',
            token: '12345'
          },
          json: false,
          method: 'GET',
          timeout: expect.any(Number),
          uri: expect.stringContaining('link/to/resource')
        },
        expect.any(Function)
      )
    })

    it('should propagate errors from Request()', async () => {
      const response = { statusCode: 500, statusMessage: 'failed to fetch link' }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, JSON.stringify({}))
      })

      await expect(
        Client.requestFromLink('12345', 'link/to/resource')
      ).rejects.toThrow('failed to fetch link')
    })
  })

  describe('requestFileUpload', () => {
    it('should call ETagRequest with PUT and the correct content type', async () => {
      const payload = Buffer.from('file content')

      await Client.requestFileUpload('12345', 'upload/123', payload)

      expect(mockRequest).toHaveBeenCalledWith(
        {
          headers: {
            'Content-Type': 'text/csv',
            token: '12345'
          },
          json: false,
          method: 'POST',
          timeout: expect.any(Number),
          uri: expect.stringContaining('upload/123')
        },
        expect.any(Function)
      )
    })

    it('should propagate errors from ETagRequest', async () => {
      const response = { statusCode: 500, statusMessage: 'failed to fetch link' }

      mockRequest.mockImplementationOnce((options, callback) => {
        callback(null, response, JSON.stringify({}))
      })

      await expect(
        Client.requestFileUpload('12345', 'upload/123', Buffer.from('file content'))
      ).rejects.toThrow('failed to fetch link')
    })
  })
})
