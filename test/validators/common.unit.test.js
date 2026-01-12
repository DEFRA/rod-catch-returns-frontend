const {
  apiErrors,
  getSorterForApiErrors,
  isInt,
  checkNumber,
  subNumber
} = require('../../src/validators/common')

describe('common.unit', () => {
  describe('apiErrors', () => {
    it('returns an empty array when result.errors is empty', () => {
      const result = { errors: [] }

      const output = apiErrors(result)

      expect(output).toEqual([])
    })

    it('maps a single error without optional fields', () => {
      const result = {
        errors: [
          { entity: 'DATE', message: 'INVALID' }
        ]
      }

      const output = apiErrors(result)

      expect(output).toEqual([
        { DATE: 'INVALID' }
      ])
    })

    it('maps multiple errors', () => {
      const result = {
        errors: [
          { entity: 'DATE', message: 'INVALID' },
          { entity: 'MASS', message: 'TOO_LOW' }
        ]
      }

      const output = apiErrors(result)

      expect(output).toEqual([
        { DATE: 'INVALID' },
        { MASS: 'TOO_LOW' }
      ])
    })

    it.each([
      [
        { entity: 'DATE', message: 'INVALID', property: 'day' },
        { DATE: 'INVALID', property: 'day' }
      ],
      [
        { entity: 'MASS', message: 'BAD', invalidValue: 'abc' },
        { MASS: 'BAD', invalidValue: 'abc' }
      ],
      [
        { entity: 'METHOD', message: 'UNKNOWN', property: 'id', invalidValue: 999 },
        { METHOD: 'UNKNOWN', property: 'id', invalidValue: 999 }
      ]
    ])('maps optional fields correctly: %j', (inputError, expectedOutput) => {
      const result = { errors: [inputError] }

      const output = apiErrors(result)

      expect(output).toEqual([expectedOutput])
    })
  })

  describe('getSorterForApiErrors', () => {
    it('sorts errors based on the order of provided fragments', () => {
      const sorter = getSorterForApiErrors(
        'Catch',
        'DATE',
        'MASS',
        'METHOD'
      )

      const errors = [
        { Catch: 'METHOD_INVALID' },
        { Catch: 'DATE_BAD' },
        { Catch: 'MASS_TOO_LOW' }
      ]

      const sorted = errors.sort(sorter)

      expect(sorted).toEqual([
        { Catch: 'DATE_BAD' },
        { Catch: 'MASS_TOO_LOW' },
        { Catch: 'METHOD_INVALID' }
      ])
    })

    it('returns 0 when neither error matches any fragment', () => {
      const sorter = getSorterForApiErrors('Catch', 'ACTIVITY')
      const a = { Catch: 'OTHER' }
      const b = { Catch: 'NOT_DATE' }

      expect(sorter(a, b)).toBe(0)
    })
  })

  describe('isInt', () => {
    it.each([
      ['0'],
      ['1'],
      ['42'],
      ['-5'],
      [0],
      [10],
      [-3]
    ])('returns true for integer values: %s', (value) => {
      expect(isInt(value)).toBe(true)
    })

    it.each([
      ['1.5'],
      ['3.14'],
      [2.7],
      ['abc'],
      [''],
      [null],
      [undefined],
      [NaN]
    ])('returns false for non-integer values: %s', (value) => {
      expect(isInt(value)).toBe(false)
    })
  })

  describe('checkNumber', () => {
    it.each([
      [''],
      ['   '],
      [null],
      [undefined]
    ])('returns 0 when num is blank: "%s"', (num) => {
      const errors = []
      expect(checkNumber('label', num, errors)).toBe(0)
      expect(errors).toHaveLength(0)
    })

    it('pushes NOT_A_NUMBER error when num is not numeric', () => {
      const errors = []
      const result = checkNumber('weight', 'abc', errors)

      expect(result).toBe('abc')
      expect(errors).toEqual([{ weight: 'NOT_A_NUMBER' }])
    })

    it.each([
      ['5'],
      ['0'],
      ['003'],
      ['7.5']
    ])('returns the original value when num is numeric: "%s"', (num) => {
      const errors = []
      const result = checkNumber('label', num, errors)

      expect(result).toBe(num)
      expect(errors).toHaveLength(0)
    })
  })

  describe('subNumber', () => {
    it.each([
      [''],
      ['   '],
      [null],
      [undefined]
    ])('returns 0 when num is blank: "%s"', (num) => {
      expect(subNumber(num)).toBe(0)
    })

    it.each([
      ['abc'],
      ['12x'],
      ['--'],
      ['NaN']
    ])('returns null when num is not numeric: "%s"', (num) => {
      expect(subNumber(num)).toBeNull()
    })

    it.each([
      ['5'],
      ['0'],
      ['003'],
      ['7.5'],
      [' 10 ']
    ])('returns the original value when num is numeric: "%s"', (num) => {
      expect(subNumber(num)).toBe(num)
    })
  })
})
