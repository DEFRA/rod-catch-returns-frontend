const RiversApi = require('../../src/api/rivers')
const EntityApi = require('../../src/api/cached-entity-api')

jest.mock('../../src/api/cached-entity-api')

describe('RiversApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should call the parent EntityApi constructor with path "rivers"', () => {
      const riversApi = new RiversApi()
      const pathArg = EntityApi.mock.calls[0][0]

      expect(pathArg).toBe('rivers')
    })

    it('should call the parent EntityApi constructor with a mapper function', () => {
      const riversApi = new RiversApi()
      const mapperArg = EntityApi.mock.calls[0][1]

      expect(typeof mapperArg).toBe('function')
    })

    it('the mapper function should return the id, name and internal', () => {
      const riversApi = new RiversApi()

      const mapperArg = EntityApi.mock.calls[0][1]

      const mockEntity = {
        name: 'Thames',
        internal: true,
        _links: { self: { href: 'http://localhost:5000/api/rivers/123' } }
      }

      EntityApi.keyFromLink.mockReturnValue('rivers/123')

      return mapperArg({}, mockEntity).then(result => {
        expect(result).toEqual({
          id: 'rivers/123',
          name: 'Thames',
          internal: true
        })
      })
    })
  })

  describe('sort', () => {
    it('should return -1 if a.name < b.name', () => {
      const riversApi = new RiversApi()
      const a = { name: 'A River' }
      const b = { name: 'B River' }

      expect(riversApi.sort(a, b)).toBe(-1)
    })

    it('should return 1 if a.name > b.name', () => {
      const riversApi = new RiversApi()
      const a = { name: 'Zebra River' }
      const b = { name: 'Yellow River' }

      expect(riversApi.sort(a, b)).toBe(1)
    })

    it('should return 0 if names are equal', () => {
      const riversApi = new RiversApi()
      const a = { name: 'Same River' }
      const b = { name: 'Same River' }

      expect(riversApi.sort(a, b)).toBe(0)
    })

    it('should correctly sort an array of rivers by name', () => {
      const riversApi = new RiversApi()
      const rivers = [
        { name: 'Mersey' },
        { name: 'Avon' },
        { name: 'Thames' }
      ]
      const sorted = [...rivers].sort((a, b) => riversApi.sort(a, b))
      expect(sorted.map(r => r.name)).toEqual(['Avon', 'Mersey', 'Thames'])
    })
  })
})
