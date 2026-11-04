const yearValidator = require('../../src/validators/year')

describe('year.unit', () => {
  const mockRequest = (payload) => ({ payload })

  it.each([
    { payload: {}, description: 'missing year' },
    { payload: { year: null }, description: 'null year' },
    { payload: { year: '' }, description: 'empty string year' }
  ])('returns { year: "EMPTY" } when $description', async ({ payload }) => {
    const result = await yearValidator(mockRequest(payload))

    expect(result).toEqual({ year: 'EMPTY' })
  })

  it('returns undefined when year is present', async () => {
    const result = await yearValidator(mockRequest({ year: '2024' }))

    expect(result).toBeUndefined()
  })
})
