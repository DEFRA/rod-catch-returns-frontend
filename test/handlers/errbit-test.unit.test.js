const ErrbitTestHandler = require('../../src/handlers/errbit-test')
const { getMockH } = require('../test-utils/server-test-utils')
const { logger } = require('defra-logging-facade')

jest.mock('defra-logging-facade')

const handler = new ErrbitTestHandler()

describe('errbit-test.unit', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv
    }
  })

  describe('doGet', () => {
    it('should log a serverError if the key is correct', async () => {
      process.env.ERRBIT_TEST_KEY = 'test'
      await handler.doGet({ headers: { key: 'test' } }, getMockH())

      expect(logger.serverError).toHaveBeenCalledWith('Test errbit integration')
    })

    it('should return a 200 and an empty response if the key is correct', async () => {
      process.env.ERRBIT_TEST_KEY = 'test'
      const result = await handler.doGet({ headers: { key: 'test' } }, getMockH())

      expect(result.statusCode).toBe(200)
      expect(result.payload.length).toBe(0)
    })

    it('should not log a serverError if the key is incorrect', async () => {
      process.env.ERRBIT_TEST_KEY = 'test'
      await handler.doGet({ headers: { key: 'incorrect-key' } }, getMockH())

      expect(logger.serverError).not.toHaveBeenCalled()
    })

    it('should not log an info message if the ERRBIT_TEST_KEY is not defined', async () => {
      delete process.env.ERRBIT_TEST_KEY
      await handler.doGet({ headers: { key: 'test' } }, getMockH())

      expect(logger.info).toHaveBeenCalledWith('ERRBIT_TEST_KEY has not been set')
    })

    it('should return a 500 and an empty response if the ERRBIT_TEST_KEY is not defined', async () => {
      delete process.env.ERRBIT_TEST_KEY
      const result = await handler.doGet({ headers: { key: 'test' } }, getMockH())

      expect(result.statusCode).toBe(500)
      expect(result.payload.length).toBe(0)
    })
  })
})
