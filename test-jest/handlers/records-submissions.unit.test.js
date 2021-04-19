const mockGetById = jest.fn()

const RecordsSearchResultsHandler = require('../../src/handlers/records-submissions')
require('../../src/api/submissions')
require('../../src/handlers/display-data')

jest.mock('./../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getById: mockGetById
    }
  })
})

jest.mock('../../src/handlers/display-data', () => () => ({
  activities: {},
  catches: {},
  smallCatches: {},
  foundInternal: true
}))

const mockRedirect = jest.fn()
const mockView = jest.fn()
const h = {
  redirect: mockRedirect,
  view: mockView
}

describe('records-submissions', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should redirect to /records if recordsSubmissionId is not on the cache', async () => {
      const recordsSubmissionsHandler = new RecordsSearchResultsHandler('/records-submissions')

      const mockCacheGet = jest.fn(() => ({}))
      const request = {
        cache: () => ({
          get: mockCacheGet
        })
      }

      await recordsSubmissionsHandler.doGet(request, h)

      expect(mockRedirect).toHaveBeenCalledWith('/records')
    })

    it('should display the records-submissions page', async () => {
      const recordsSubmissionsHandler = new RecordsSearchResultsHandler('/records-submissions')

      mockGetById.mockImplementationOnce(() => ({ season: '2020' }))
      const mockCacheGet = jest.fn(() => ({
        recordsSubmissionId: 'submissions/1',
        fullName: 'Homer Simpson'
      }))

      const request = {
        cache: () => ({
          get: mockCacheGet
        })
      }

      await recordsSubmissionsHandler.doGet(request, h)

      expect(mockView.mock.calls.length).toBe(1)
      expect(mockView.mock.calls[0][0]).toBe('/records-submissions')
    })
  })
})
