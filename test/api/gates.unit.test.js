const GatesApi = require('../../src/api/gates')

describe('GatesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('maps API response into formatted object', async () => {
      const input = {
        _links: {
          self: {
            href: 'https://local/api/grilseWeightGates/2'
          }
        },
        name: 'Dee'
      }

      const gatesApi = new GatesApi()
      const result = await gatesApi.doMap({}, input)

      expect(result).toEqual({
        id: '2',
        name: 'Dee'
      })
    })
  })
})
