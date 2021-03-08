const mockGetByContactId = jest.fn()

const RecordsSearchResultsHandler = require('../../src/handlers/records-search-results')
require('../../src/api/submissions')

jest.mock('./../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => {
    return { getByContactId: mockGetByContactId }
  })
})

const mockRedirect = jest.fn()
const mockView = jest.fn()
const h = {
  redirect: mockRedirect,
  view: mockView
}

describe('records-search-results', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should redirect to /records if contactId is not on the cache', async () => {
      const recordsSearchResultsHandler = new RecordsSearchResultsHandler('/records-search-results')

      const mockCacheGet = jest.fn(() => ({}))
      const request = {
        cache: () => ({
          get: mockCacheGet
        })
      }

      await recordsSearchResultsHandler.doGet(request, h)

      expect(mockRedirect).toHaveBeenCalledWith('/records')
    })

    it('should display the records-search-results page and get the submissions for an Angler', async () => {
      const recordsSearchResultsHandler = new RecordsSearchResultsHandler('/records-search-results')

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
      expect(mockGetByContactId).toHaveBeenCalledTimes(1)
      expect(mockGetByContactId).toHaveBeenCalledWith(request, '123')
    })
  })
})
