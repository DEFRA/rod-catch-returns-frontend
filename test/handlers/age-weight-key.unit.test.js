const mockGatesList = jest.fn()
jest.mock('../../src/api/gates', () => {
  return jest.fn().mockImplementation(() => ({
    list: mockGatesList
  }))
})

const AgeWeightKeyHandler = require('../../src/handlers/age-weight-key')
const BaseHandler = require('../../src/handlers/base')
const Fs = require('fs')
const moment = require('moment')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('fs')

const getMockRequest = (overrides) => ({
  query: {},
  payload: {},
  cache: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({}),
    set: jest.fn(),
    drop: jest.fn()
  })),
  ...overrides
})

const setupGates = (gates = [{ id: 'g1', name: 'Gate 1' }]) => {
  mockGatesList.mockResolvedValueOnce(gates)
}

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
      it('should clear cache if request.query.clear is set', async () => {
        const mockSuperClearCacheErrorsAndPayload = BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn()
        setupGates()
        const handler = new AgeWeightKeyHandler()

        await handler.doGet(getMockRequest({ query: { clear: 'true' } }), getMockH())

        expect(mockSuperClearCacheErrorsAndPayload).toHaveBeenCalled()
      })

      it('should not clear cache if request.query.clear is not set', async () => {
        const mockSuperClearCacheErrorsAndPayload = BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn()
        setupGates()
        const handler = new AgeWeightKeyHandler()

        await handler.doGet(getMockRequest(), getMockH())

        expect(mockSuperClearCacheErrorsAndPayload).not.toHaveBeenCalled()
      })

      it('should return the mapped gates and year', async () => {
        BaseHandler.prototype.clearCacheErrorsAndPayload = jest.fn()
        setupGates([
          { id: '1', name: 'Gate A' },
          { id: '2', name: 'Gate B' }
        ])
        const handler = new AgeWeightKeyHandler('age-weight-key')
        const h = getMockH()

        const mockYear = 2025
        jest.spyOn(moment.prototype, 'year').mockReturnValue(mockYear)

        await handler.doGet(getMockRequest(), h)

        expect(h.view).toHaveBeenCalledWith(
          'age-weight-key',
          expect.objectContaining({
            gates: [
              { id: '1', name: 'Gate A' },
              { id: '2', name: 'Gate B' }
            ],
            years: [
              (mockYear - 2).toString(),
              (mockYear + 2).toString()
            ]
          })
        )
      })
    })

    describe('doPost', () => {
      it('should redirect to age-weight-key-ok page when there are no errors', async () => {
        setupGates()
        const h = getMockH()
        const request = getMockRequest({
          payload: {
            year: '2025',
            gate: 'g1',
            upload: { path: '/tmp/file.tmp', filename: 'file.csv' }
          }
        })
        const handler = new AgeWeightKeyHandler('age-weight-key')

        await handler.doPost(request, h, null)

        expect(h.redirect).toHaveBeenCalledWith('/age-weight-key-ok')
      })

      it('should redirect to age-weight-key-conflict-check check when errors include OVERWRITE_DISALLOWED', async () => {
        setupGates()
        const request = getMockRequest({
          payload: { year: '2025', gate: 'g1' }
        })
        const errors = [{ type: 'OVERWRITE_DISALLOWED' }]
        const handler = new AgeWeightKeyHandler('age-weight-key')
        const h = getMockH()

        await handler.doPost(request, h, errors)

        expect(h.redirect).toHaveBeenCalledWith('/age-weight-key-conflict-check')
      })

      it('should redirect back to upload page when errors exist but not OVERWRITE_DISALLOWED', async () => {
        const mockSuperWriteCacheAndRedirect = BaseHandler.prototype.writeCacheAndRedirect = jest.fn()
        setupGates()
        const request = getMockRequest({
          payload: {
            year: '2025',
            gate: 'g1',
            upload: { path: '/tmp/file.tmp', filename: 'file.csv' }
          }
        })
        const errors = [{ type: 'OTHER_ERROR' }]
        const handler = new AgeWeightKeyHandler('age-weight-key')
        const h = getMockH()

        await handler.doPost(request, h, errors)

        expect(mockSuperWriteCacheAndRedirect).toHaveBeenCalledWith(
          request,
          h,
          errors,
          null,
          '/age-weight-key'
        )
      })

      it('should populate cacheContext with gate info and upload details', async () => {
        const mockSuperSetCacheContext = BaseHandler.prototype.setCacheContext = jest.fn()
        setupGates()
        const request = getMockRequest({
          payload: {
            year: '2025',
            gate: 'g1',
            upload: { path: '/tmp/file.tmp', filename: 'file.csv' }
          }
        })
        const handler = new AgeWeightKeyHandler('age-weight-key')
        const h = getMockH()

        await handler.doPost(request, h, null)

        expect(mockSuperSetCacheContext).toHaveBeenCalledWith(
          request,
          expect.objectContaining({
            ageWeightKey: expect.objectContaining({
              year: '2025',
              gateName: 'Gate 1',
              gateId: 'g1',
              tempfile: '/tmp/file.tmp',
              filename: 'file.csv'
            }),
            payload: request.payload,
            errors: null
          })
        )
      })

      it('should populate cacheContext with an empty gate name and id, if they are not present', async () => {
        const mockSuperSetCacheContext = BaseHandler.prototype.setCacheContext = jest.fn()
        setupGates([])
        const request = getMockRequest({
          payload: {
            year: '2025',
            gate: 'g1',
            upload: { path: '/tmp/file.tmp', filename: 'file.csv' }
          }
        })
        const handler = new AgeWeightKeyHandler('age-weight-key')
        const h = getMockH()

        await handler.doPost(request, h, null)

        expect(mockSuperSetCacheContext).toHaveBeenCalledWith(
          request,
          expect.objectContaining({
            ageWeightKey: expect.objectContaining({
              year: '2025',
              gateName: '',
              gateId: '',
              tempfile: '/tmp/file.tmp',
              filename: 'file.csv'
            }),
            payload: request.payload,
            errors: null
          })
        )
      })
    })
  })
})
