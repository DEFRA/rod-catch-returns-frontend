const reviewValidator = require('../../src/validators/review')

describe('review-validator.unit', () => {
  it.each([
    { payload: { continue: true, confirm: 'yes' }, description: 'continue is present and confirm is yes' },
    { payload: { unlock: true }, description: 'unlock is present' },
    { payload: {}, description: 'payload has neither continue nor unlock' }
  ])('returns null when $description', async ({ payload }) => {
    const request = { payload }

    const result = await reviewValidator(request)

    expect(result).toBeNull()
  })

  it.each([
    { payload: { continue: true }, description: 'confirm is missing' },
    { payload: { continue: true, confirm: false }, description: 'confirm is false' },
    { payload: { continue: true, confirm: '' }, description: 'confirm is an empty string' },
    { payload: { continue: true, confirm: 'no' }, description: 'confirm is not yes' }
  ])('returns an error when continue is present and $description', async ({ payload }) => {
    const request = { payload }

    const result = await reviewValidator(request)

    expect(result).toEqual([{ confirm: 'EMPTY' }])
  })
})

