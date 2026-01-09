const ageWeightKeyConflictValidator = require('../../src/validators/age-weight-key-conflict')

describe('conflict-validator.unit', () => {
  it('should return null when overwrite=true', async () => {
    const request = {
      payload: { overwrite: true }
    }

    const result = await ageWeightKeyConflictValidator(request)

    expect(result).toBeNull()
  })

  it.each([
    { description: ' is missing', payload: {} },
    { description: '=false', payload: { overwrite: false } }
  ])('should return error array when overwrite$description', async ({ payload }) => {
    const request = {
      payload
    }

    const result = await ageWeightKeyConflictValidator(request)

    expect(result).toEqual([{ override: 'NO_OVERRIDE_SELECTED' }])
  })
})
