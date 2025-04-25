const LoginHandler = require('../../src/handlers/login')

jest.mock('../../src/lib/authenticate-user')

const mockRedirect = jest.fn()
const mockView = jest.fn()
const h = {
  redirect: mockRedirect,
  view: mockView
}
describe('login', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('doGet', () => {
    it('should display the authentication page', async () => {
      const loginHandler = new LoginHandler()
      await loginHandler.doGet({}, h)

      expect(mockView.mock.calls.length).toBe(1)
    })
  })

  describe('doPost', () => {
    it('should redirect to login failed if there are any errors', async () => {
      const request = {
        query: {}
      }
      const loginHandler = new LoginHandler()
      await loginHandler.doPost(request, h, {})

      expect(mockRedirect.mock.calls.length).toBe(1)
      expect(mockRedirect.mock.calls[0][0]).toBe('/login-fail')
    })

    it('should redirect to login failed, with correct next url if there are any errors', async () => {
      const request = {
        query: {
          next: '/lookup?submissionId=submissions/1'
        }
      }
      const loginHandler = new LoginHandler()
      await loginHandler.doPost(request, h, {})

      expect(mockRedirect.mock.calls.length).toBe(1)
      expect(mockRedirect.mock.calls[0][0]).toBe('/login-fail?next=%2Flookup%3FsubmissionId%3Dsubmissions%2F1')
    })

    it('should redirect to the license page after successful login', async () => {
      const request = {
        query: {}
      }
      const loginHandler = new LoginHandler()
      await loginHandler.doPost(request, h)

      expect(mockRedirect.mock.calls.length).toBe(1)
      expect(mockRedirect.mock.calls[0][0]).toBe('/licence')
    })

    it('should redirect to the page in the next variable, after successful login', async () => {
      const request = {
        query: {
          next: '/lookup?submissionId=submissions/1'
        },
        raw: {
          req: {
            url: '/login?next=%2Flookup%3FsubmissionId%3Dsubmissions%2F1'
          }
        }
      }
      const loginHandler = new LoginHandler()
      await loginHandler.doPost(request, h)

      expect(mockRedirect.mock.calls.length).toBe(1)
      expect(mockRedirect.mock.calls[0][0]).toBe('/lookup?submissionId=submissions/1')
    })

    it('should redirect to the page in the next variable, after successful login on the login-fail page', async () => {
      const request = {
        query: {
          next: '/lookup?submissionId=submissions/1'
        },
        raw: {
          req: {
            url: '/login-fail?next=%2Flookup%3FsubmissionId%3Dsubmissions%2F1'
          }
        }
      }
      const loginHandler = new LoginHandler()
      await loginHandler.doPost(request, h)

      expect(mockRedirect.mock.calls.length).toBe(1)
      expect(mockRedirect.mock.calls[0][0]).toBe('/lookup?submissionId=submissions/1')
    })
  })
})
