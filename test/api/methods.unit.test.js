const MethodsApi = require('../../src/api/methods')

describe('methods.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('maps API response into formatted object', async () => {
      const input = {
        _links: {
          self: {
            href: 'https://local/api/methods/2'
          }
        },
        name: 'Fly',
        internal: false
      }

      const methodsApi = new MethodsApi()
      const result = await methodsApi.doMap({}, input)

      expect(result).toEqual({
        id: 'methods/2',
        name: 'Fly',
        internal: false
      })
    })
  })
})
