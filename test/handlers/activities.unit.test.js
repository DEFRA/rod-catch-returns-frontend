const { ActivitiesHandler } = require('../../src/handlers/activities')
const { isAllowedParam, testLocked } = require('../../src/handlers/common')
const { getMockH } = require('../test-utils/server-test-utils')
const { Error: ResponseError, status: ResponseStatus } = require('../../src/handlers/response-error')

jest.mock('../../src/handlers/common', () => ({
  isAllowedParam: jest.fn(),
  testLocked: jest.fn()
}))

const handler = new ActivitiesHandler()

describe('activities.unit', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  const getMockRequest = () => ({
    path: '/activities/add',
    params: { id: 'add' },
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ submissionId: 'sub-1' }),
      set: jest.fn()
    }))

  })

  describe('doGet', () => {
    it('should throw a ResponseError if id param is not present', async () => {
      isAllowedParam.mockReturnValue(false)

      await expect(handler.doGet(getMockRequest(), getMockH())).rejects.toThrow(ResponseError)
    })

    it('should return a 403 if id param is not present', async () => {
      isAllowedParam.mockReturnValue(false)

      await expect(handler.doGet(getMockRequest(), getMockH())).rejects.toMatchObject({
        message: 'Unknown activity',
        statusCode: ResponseStatus.UNAUTHORIZED
      })
    })
  })
})
