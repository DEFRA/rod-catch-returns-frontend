const mockGatesList = jest.fn()
jest.mock('../../src/api/gates', () => {
  return jest.fn().mockImplementation(() => ({
    list: mockGatesList
  }))
})

const AgeWeightKeyHandler = require('../../src/handlers/age-weight-key')
const BaseHandler = require('../../src/handlers/base')
const Fs = require('fs')

jest.mock('fs')

describe('age-weight-key.unit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('AgeWeightKeyHandler', () => {
    describe('removeTempFile', () => {
      it('should remove the temp file if upload exists', () => {
        const request = {
          payload: {
            upload: { path: '/tmp/file1.tmp' }
          }
        }
        const handler = new AgeWeightKeyHandler()

        handler.removeTempFile(request)

        expect(Fs.unlinkSync).toHaveBeenCalledWith('/tmp/file1.tmp')
      })

      it('should not remove a temp file if upload is missing', () => {
        const request = { payload: {} }
        const handler = new AgeWeightKeyHandler()

        handler.removeTempFile(request)

        expect(Fs.unlinkSync).not.toHaveBeenCalled()
      })
    })

    describe('doGet', () => {
      it('should clear cache if request.query.clear is set', () => {
        // BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn()

        /*
         * const handler = new AgeWeightKeyHandler()
         * handler.removeTempFile
         */
      })
    })
  })
})
