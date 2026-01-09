const loginValidator = require('../../src/validators/login')

describe('login-validator.unit', () => {
  it('returns null when authorization is present', async () => {
    const request = {
      app: { authorization: true }
    }

    const result = await loginValidator(request)

    expect(result).toBeNull()
  })

  it.each([
    { request: { app: {} }, description: 'missing' },
    { request: { app: { authorization: null } }, description: 'null' },
    { request: { app: { authorization: false } }, description: 'false' }
  ])('returns an error when authorization is $description', async ({ request }) => {
    const result = await loginValidator(request)

    expect(result).toEqual([{ authorization: 'NO_FOUND' }])
  })
})
