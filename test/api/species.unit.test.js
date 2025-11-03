const EntityApi = require('../../src/api/cached-entity-api')
const SpeciesApi = require('../../src/api/species')

jest.mock('../../src/api/cached-entity-api')

describe('SpeciesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should construct SpeciesApi by calling EntityApi with path "species"', () => {
    const speciesApi = new SpeciesApi()

    expect(EntityApi).toHaveBeenCalledWith('species')
  })
})
