const SummaryHandler = require('../../src/handlers/summary')
const SubmissionsApi = require('../../src/api/submissions')
const displayData = require('../../src/handlers/display-data')
const Common = require('../../src/handlers/common')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions')
jest.mock('../../src/handlers/display-data')
jest.mock('../../src/handlers/common')

describe('summary-handler.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  const getMockRequest = (cacheObj = {}, payload = {}) => ({
    path: '/summary',
    payload,
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValueOnce(cacheObj),
      set: jest.fn().mockResolvedValueOnce()
    }))
  })

  const getMockSubmission = (overrides = {}) => ({
    id: 'submissions/1',
    reportingExclude: false,
    ...overrides
  })

  const setupSubmissionApi = (submission) => {
    const [submissionsApi] = SubmissionsApi.mock.instances
    submissionsApi.getById.mockResolvedValueOnce(submission)
    return submissionsApi
  }

  describe('doGet', () => {
    it('should redirect to review if submission is locked', async () => {
      const handler = new SummaryHandler('summary')
      const request = getMockRequest({ submissionId: 'submissions/1' })
      const h = getMockH()
      setupSubmissionApi(getMockSubmission())
      Common.testLocked.mockResolvedValueOnce(true)

      await handler.doGet(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/review')
    })

    it('should clean add and delete from cache', async () => {
      const handler = new SummaryHandler('summary')
      const cacheObj = {
        submissionId: 'submissions/1',
        add: { river: 'r1' },
        delete: { id: 'c1' }
      }
      const request = getMockRequest(cacheObj)
      const h = getMockH()

      setupSubmissionApi(getMockSubmission())
      Common.testLocked.mockResolvedValueOnce(false)
      displayData.mockResolvedValueOnce({
        activities: [],
        catches: [],
        smallCatches: [],
        foundInternal: false
      })

      await handler.doGet(request, h)

      expect(cacheObj).toStrictEqual({
        back: '/summary',
        submissionId: 'submissions/1'
      })
    })

    it('should set submissionId and back path in cache', async () => {
      const handler = new SummaryHandler('summary')
      const cacheGet = jest.fn().mockResolvedValueOnce({ submissionId: 'submissions/1' })
      const cacheSet = jest.fn().mockResolvedValueOnce()
      const request = {
        path: '/summary',
        cache: jest.fn(() => ({
          get: cacheGet,
          set: cacheSet
        }))
      }
      const h = getMockH()
      setupSubmissionApi(getMockSubmission({ id: 'submissions/99' }))
      Common.testLocked.mockResolvedValueOnce(false)
      displayData.mockResolvedValueOnce({
        activities: [],
        catches: [],
        smallCatches: [],
        foundInternal: false
      })

      await handler.doGet(request, h)

      expect(cacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          submissionId: 'submissions/99',
          back: '/summary'
        })
      )
    })

    it('should render summary view with display data', async () => {
      const handler = new SummaryHandler('summary')
      const cacheObj = {
        submissionId: 'submissions/1',
        year: 2025,
        licenceNumber: 'AAA-111',
        postcode: 'AA11 1AA'
      }
      const request = getMockRequest(cacheObj)
      const h = getMockH()
      setupSubmissionApi(getMockSubmission({ reportingExclude: true }))
      Common.testLocked.mockResolvedValueOnce(false)
      displayData.mockResolvedValueOnce({
        activities: [{ id: 'a1' }],
        catches: [{ id: 'c1' }],
        smallCatches: [{ id: 's1' }],
        foundInternal: true
      })

      await handler.doGet(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'summary',
        {
          year: 2025,
          activities: [{ id: 'a1' }],
          catches: [{ id: 'c1' }],
          smallCatches: [{ id: 's1' }],
          reportingExclude: true,
          foundInternal: true,
          details: {
            licenceNumber: 'AAA-111',
            postcode: 'AA11 1AA',
            year: 2025
          }
        }
      )
    })
  })

  describe('doPost', () => {
    it('should redirect to /save when CONTEXT=FMT and save present in payload', async () => {
      process.env.CONTEXT = 'FMT'
      const handler = new SummaryHandler('summary')
      const request = getMockRequest({}, { save: true })
      const h = getMockH()

      await handler.doPost(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/save')
    })

    it('should redirect to review when CONTEXT=FMT and save not present', async () => {
      process.env.CONTEXT = 'FMT'
      const handler = new SummaryHandler('summary')
      const request = getMockRequest({}, {})
      const h = getMockH()

      await handler.doPost(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/review')
    })

    it('should redirect to review when CONTEXT is not FMT', async () => {
      process.env.CONTEXT = 'ANGLER'
      const handler = new SummaryHandler('summary')
      const request = getMockRequest({}, { save: true })
      const h = getMockH()

      await handler.doPost(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/review')
    })
  })
})
