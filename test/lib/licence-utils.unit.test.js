
const {
  licenceSchema,
  parsePostcode,
  parseLicence
} = require('../../src/lib/licence-utils')

describe('licence-utils.unit', () => {
  describe('licenceSchema', () => {
    it('should validate successfully when licence and postcode are valid', () => {
      const data = { licence: 'ABC123', postcode: 'AB12 3CD' }
      const { error, value } = licenceSchema.validate(data)

      expect(error).toBeUndefined()
      expect(value).toEqual(data)
    })

    it.each([
      [{ licence: undefined, postcode: 'AB12 3CD' }, '"licence" is required'],
      [{ licence: '', postcode: 'AB12 3CD' }, '"licence" is not allowed to be empty'],
      [{ licence: 'ABC12', postcode: 'AB12 3CD' }, '"licence" length must be 6 characters long'],
      [{ licence: 'ABC1234', postcode: 'AB12 3CD' }, '"licence" length must be 6 characters long'],
      [{ licence: 'ABC12$', postcode: 'AB12 3CD' }, '"licence" must only contain alpha-numeric characters']
    ])('should return an error when licence is invalid (%j)', (data, expectedMsg) => {
      const { error } = licenceSchema.validate(data)
      expect(error).toBeDefined()
      expect(error.message).toContain(expectedMsg)
    })

    it.each([
      [{ licence: 'ABC123', postcode: undefined }, '"postcode" is required'],
      [{ licence: 'ABC123', postcode: '' }, '"postcode" is not allowed to be empty']
    ])('should return an error when postcode is invalid (%j)', (data, expectedMsg) => {
      const { error } = licenceSchema.validate(data)
      expect(error).toBeDefined()
      expect(error.message).toContain(expectedMsg)
    })
  })

  describe('parseLicence', () => {
    it.each([
      [' ab  c123 '],
      ['ABC123'],
      ['abc123']
    ])('transforms %s to ABC123', (input) => {
      const result = parseLicence(input)
      expect(result).toBe('ABC123')
    })

    it('should return an empty string if input is an empty string', () => {
      const result = parseLicence('')
      expect(result).toBe('')
    })
  })

  describe('parsePostcode', () => {
    it.each([
      ['ba21nw', 'BA2 1NW'],
      [' AB12    3CD ', 'AB12 3CD'],
      ['AB123CD ', 'AB12 3CD'],
      ['A99AA', 'A9 9AA']
    ])('formats the UK postcode %s successfully as %s', async (postcode, replacedValue) => {
      const result = parsePostcode(postcode)

      expect(result).toBe(replacedValue)
    })

    it.each([
      ['BS1 5AH'],
      ['WA4 1HT'],
      ['NE4 7AR'],
      ['A9 9AA']
    ])('does not change the format of the UK postcode %s', async (postcode) => {
      const result = parsePostcode(postcode)

      expect(result).toBe(postcode)
    })

    it.each([
      ['22041'],
      ['D24 CK66'],
      ['6011']
    ])('does not change the format of the non-UK postcode %s', async (postcode) => {
      const result = parsePostcode(postcode)

      expect(result).toBe(postcode)
    })
  })
})
