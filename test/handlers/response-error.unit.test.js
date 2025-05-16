
const ResponseError = require('../../src/handlers/response-error')

describe('ResponseError', () => {
  const message = 'Something went wrong'
  const statusCode = ResponseError.status.FORBIDDEN
  const body = { detail: 'You are not allowed to access this resource' }

  it('should set the message correctly', () => {
    const error = new ResponseError.Error(message, statusCode, body)

    expect(error.message).toBe(message)
  })

  it('should expose statusCode via getter', () => {
    const error = new ResponseError.Error(message, statusCode, body)

    expect(error.statusCode).toBe(ResponseError.status.FORBIDDEN)
  })

  it('should expose name via getter', () => {
    const error = new ResponseError.Error(message, statusCode, body)

    expect(error.name).toBe('Request error')
  })

  it('should expose body via getter', () => {
    const error = new ResponseError.Error(message, statusCode, body)

    expect(error.body).toEqual(body)
  })
})
