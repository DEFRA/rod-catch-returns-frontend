const populateResultsMock = jest.fn(rivers => rivers)

describe('.getRiversSuggestions', () => {
  let results
  beforeEach(jest.clearAllMocks)

  beforeAll(() => {
    document.body.innerHTML = `
      <select id="river">
        <option value="rivers/1">Calder (Cumbria)</option>
        <option value="rivers/2">Calder (Lancashire)</option>
        <option value="rivers/3">Calder (Yorkshire)</option>
        <option value="rivers/4">Caldew</option>
        <option value="rivers/5">Camel</option>
        <option value="rivers/6">Caseg</option>
        <option value="rivers/7">Darent</option>
        <option value="rivers/8">Dart<option>
        <option value="rivers/9">Dee</option>
        <option value="rivers/10">Dewi Fawr</option>
      </select>
      `
    const { getRiversSuggestions } = require('../../../src/assets/javascript/rivers-autocomplete')

    results = getRiversSuggestions('de', populateResultsMock)
  })

  it('prioritises river names which start with the query', () => {
    expect(results[0]).toBe('Dee')
    expect(results[1]).toBe('Dewi Fawr')
  })

  it('also includes river names which contain the query', () => {
    expect(results[2]).toBe('Calder (Cumbria)')
    expect(results[3]).toBe('Calder (Lancashire)')
    expect(results[4]).toBe('Calder (Yorkshire)')
    expect(results[5]).toBe('Caldew')
  })

  it('does not suggest river names which do not contain the query', () => {
    expect(results).not.toContain('Camel', 'Caseg', 'Darent', 'Dart')
  })

  it('does not search text contained in brackets', () => {
    const { getRiversSuggestions } = require('../../../src/assets/javascript/rivers-autocomplete')

    results = getRiversSuggestions('la', populateResultsMock)
    expect(results).toHaveLength(0)
  })
})
