const DeleteCatchHandler = require('../../src/handlers/delete-catch')
const BaseHandler = require('../../src/handlers/base')

describe('delete-catch-handler.unit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('DeleteCatchHandler', () => {
    it('should be an instance of BaseHandler', () => {
      const handler = new DeleteCatchHandler('delete-catch')
      expect(handler).toBeInstanceOf(BaseHandler)
    })
  })
})
