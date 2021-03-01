const RecordsHandler = require('../../src/handlers/records')

jest.mock('../../src/lib/authenticate-user')

const mockRedirect = jest.fn()
const mockView = jest.fn()
const h = {
  redirect: mockRedirect,
  view: mockView
}

describe('records', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should display the records page', async () => {
      const recordsandler = new RecordsHandler('records')
      await recordsandler.doGet({}, h)

      expect(mockView.mock.calls.length).toBe(1)
      expect(mockView.mock.calls[0][0]).toBe('records')
    })
  })

  describe('doPost', () => {
    it('should display the records page if there are errors', async () => {
      const recordsandler = new RecordsHandler('records')

      const request = { payload: '123' }
      const errors = { error: [{ licenceNumber: 'NOT_FOUND' }] }
      await recordsandler.doGet(request, h, errors)

      expect(mockView.mock.calls.length).toBe(1)
      expect(mockView.mock.calls[0][0]).toBe('records')
    })

    it('should redirect to the records-search-results page and set the contactId on the cache if there are no errors', async () => {
      const mockCacheGet = jest.fn(() => ({
        contactId: ''
      }))
      const mockCacheSet = jest.fn()
      const request = {
        payload: {
          licence: {
            contact: {
              id: '123'
            }
          }
        },
        cache: () => ({
          get: mockCacheGet,
          set: mockCacheSet
        })
      }

      const recordsandler = new RecordsHandler('records')
      await recordsandler.doPost(request, h)

      expect(mockRedirect.mock.calls.length).toBe(1)
      expect(mockRedirect.mock.calls[0][0]).toBe('/records-search-results')
      expect(mockCacheSet.mock.calls[0][0]).toStrictEqual({ contactId: '123' })
    })
  })
})
