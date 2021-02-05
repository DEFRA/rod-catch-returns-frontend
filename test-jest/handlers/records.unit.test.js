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
    it('should display the records page', async () => {
      const recordsandler = new RecordsHandler('records')
      await recordsandler.doPost({}, h)

      expect(mockView.mock.calls.length).toBe(1)
      expect(mockView.mock.calls[0][0]).toBe('records')
    })
  })
})
