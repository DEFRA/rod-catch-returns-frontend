const RecordsSearchResultsHandler = require('../../src/handlers/records-search-results')
const SubmissionsApi = require('../../src/api/submissions')

jest.mock('../../src/api/submissions')

const mockRedirect = jest.fn()
const mockView = jest.fn()
const h = {
  redirect: mockRedirect,
  view: mockView
}

describe('records-search-results', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should display the records-search-results page and get the submissions for and Angler', async () => {
      const recordsSearchResultsHandler = new RecordsSearchResultsHandler('/records-search-results')

      const mockSubmissionsApiInstance = SubmissionsApi.mock.instances[0]
      const mockGetByContactId = mockSubmissionsApiInstance.getByContactId

      const mockCacheGet = jest.fn(() => ({
        contactId: '123'
      }))
      const mockCacheSet = jest.fn()
      const request = {
        cache: () => ({
          get: mockCacheGet,
          set: mockCacheSet
        })
      }

      await recordsSearchResultsHandler.doGet(request, h)

      expect(mockView.mock.calls.length).toBe(1)
      expect(mockView.mock.calls[0][0]).toBe('/records-search-results')
      expect(mockGetByContactId).toHaveBeenCalledWith(request, '123')
      expect(mockGetByContactId).toHaveBeenCalledTimes(1)
    })
  })
})
