const validate = require('../../src/validators/year') // adjust path

describe('licence-postcode.unit', () => {
  const mockRequest = (payload) => ({ payload })

  it.each([
    { payload: {}, description: 'missing year' },
    { payload: { year: null }, description: 'null year' },
    { payload: { year: '' }, description: 'empty string year' }
  ])('returns { year: "EMPTY" } when $description', async ({ payload }) => {
    const result = await validate(mockRequest(payload))

    expect(result).toEqual({ year: 'EMPTY' })
  })

  it('returns undefined when year is present', async () => {
    const result = await validate(mockRequest({ year: '2024' }))

    expect(result).toBeUndefined()
  })
})
