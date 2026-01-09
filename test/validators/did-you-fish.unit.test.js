const didYouFishValidator = require('../../src/validators/did-you-fish')

describe('did-you-fish-validator.unit', () => {
  it('returns null when dyf is provided', async () => {
    const request = {
      payload: { dyf: 'yes' }
    }

    const result = await didYouFishValidator(request)

    expect(result).toBeNull()
  })

  it.each([
    { payload: {}, description: 'is missing' },
    { payload: { dyf: false }, description: 'is false' },
    { payload: { dyf: '' }, description: 'is an empty string' }
  ])('returns an error when dyf $description', async ({ payload }) => {
    const request = { payload }

    const result = await didYouFishValidator(request)

    expect(result).toEqual([{ dyf: 'EMPTY' }])
  })
})
