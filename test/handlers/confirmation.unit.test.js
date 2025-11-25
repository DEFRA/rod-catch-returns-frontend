const mockGetById = jest.fn()

const ConfirmHandler = require('../../src/handlers/confirmation')
const ReviewHandler = require('../../src/handlers/review')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetById
  }))
})

describe('confirm-handler.unit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const getMockRequest = () => ({
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ submissionId: '123', year: '2025' })
    }))
  })

  describe('doGet', () => {
    it('should call reviewReturn when submission status is SUBMITTED', async () => {
      const request = getMockRequest()
      const h = getMockH()
      const handler = new ConfirmHandler('confirm')
      const submission = { status: 'SUBMITTED' }
      mockGetById.mockResolvedValue(submission)
      ReviewHandler.prototype.reviewReturn = jest.fn()

      await handler.doGet(request, h)

      expect(ReviewHandler.prototype.reviewReturn).toHaveBeenCalledWith(
        request,
        h,
        { year: '2025' }
      )
    })

    it('should throw ResponseError if submission status is not SUBMITTED', async () => {
      const request = getMockRequest()
      const h = getMockH()
      const handler = new ConfirmHandler('confirm')
      const submission = { status: 'DRAFT' }
      mockGetById.mockResolvedValue(submission)

      await expect(handler.doGet(request, h)).rejects.toThrow('Illegal access of the confirmation page')
    })
  })
})
