const activityValidator = require('../../src/validators/activity')
const ActivitiesApi = require('../../src/api/activities')
const Common = require('../../src/validators/common')

jest.mock('../../src/api/activities')
jest.mock('../../src/validators/common')

describe('activity.unit', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  const getMockRequest = (cacheObj = {}, payload = {}) => {
    const cache = {
      get: jest.fn().mockResolvedValue(cacheObj)
    }

    return {
      payload,
      cache: jest.fn(() => cache)
    }
  }

  const setupCommonMocks = ({
    daysOther = 1,
    daysMandatory = 2
  } = {}) => {
    Common.checkNumber
      .mockImplementationOnce(() => daysOther)
      .mockImplementationOnce(() => daysMandatory)

    Common.subNumber
      .mockImplementationOnce((v) => v)
      .mockImplementationOnce((v) => v)
  }

  describe('number validation', () => {
    it('should call checkNumber for both day fields', async () => {
      setupCommonMocks()
      const request = getMockRequest(
        { submissionId: 'sub-1' },
        { river: 'r1', daysFishedOther: 1, daysFishedWithMandatoryRelease: 2 }
      )

      const [activitiesApi] = ActivitiesApi.mock.instances
      activitiesApi.add.mockResolvedValueOnce({})

      await activityValidator(request)

      expect(Common.checkNumber).toHaveBeenCalledWith(
        'daysFishedOther',
        1,
        expect.any(Array)
      )

      expect(Common.checkNumber).toHaveBeenCalledWith(
        'daysFishedWithMandatoryRelease',
        2,
        expect.any(Array)
      )
    })
  })

  it('should call activitiesApi.add when no activity exists in cache', async () => {
    setupCommonMocks()

    const request = getMockRequest(
      { submissionId: 'sub-1' },
      { river: 'r1', daysFishedOther: 1, daysFishedWithMandatoryRelease: 2 }
    )

    const [activitiesApi] = ActivitiesApi.mock.instances
    activitiesApi.add.mockResolvedValueOnce({})

    const result = await activityValidator(request)

    expect(activitiesApi.add).toHaveBeenCalledWith(
      request,
      'sub-1',
      'r1',
      2,
      1
    )

    expect(result).toBeNull()
  })

  it('should call activitiesApi.change when activity exists in cache', async () => {
    setupCommonMocks()

    const request = getMockRequest(
      {
        submissionId: 'sub-1',
        activity: { id: 'act-1' }
      },
      { river: 'r1', daysFishedOther: 1, daysFishedWithMandatoryRelease: 2 }
    )

    const [activitiesApi] = ActivitiesApi.mock.instances
    activitiesApi.change.mockResolvedValueOnce({})

    const result = await activityValidator(request)

    expect(activitiesApi.change).toHaveBeenCalledWith(
      request,
      'act-1',
      'sub-1',
      'r1',
      2,
      1
    )

    expect(result).toBeNull()
  })

  it('should return combined validation and API errors when API returns errors', async () => {
    const validationErrors = [{ name: 'daysFishedOther', message: 'Invalid' }]
    const apiErrorResult = { errors: [{ message: 'API error' }] }
    const mappedApiErrors = [{ name: 'river', message: 'Bad river' }]

    Common.checkNumber
      .mockImplementationOnce((_, __, errors) => {
        errors.push(validationErrors[0])
        return null
      })
      .mockImplementationOnce(() => null)

    Common.subNumber.mockImplementation((v) => v)
    Common.apiErrors.mockReturnValueOnce(mappedApiErrors)

    const request = getMockRequest(
      { submissionId: 'sub-1' },
      { river: 'r1', daysFishedOther: null, daysFishedWithMandatoryRelease: null }
    )

    const [activitiesApi] = ActivitiesApi.mock.instances
    activitiesApi.add.mockResolvedValueOnce(apiErrorResult)

    const result = await activityValidator(request)

    expect(result).toEqual([
      ...validationErrors,
      ...mappedApiErrors
    ])
  })

  it('should return validation errors when present and API succeeds', async () => {
    const validationErrors = [{ name: 'daysFishedOther', message: 'Invalid' }]

    Common.checkNumber
      .mockImplementationOnce((_, __, errors) => {
        errors.push(validationErrors[0])
        return null
      })
      .mockImplementationOnce(() => null)

    Common.subNumber.mockImplementation((v) => v)

    const request = getMockRequest(
      { submissionId: 'sub-1' },
      { river: 'r1', daysFishedOther: null, daysFishedWithMandatoryRelease: null }
    )

    const [activitiesApi] = ActivitiesApi.mock.instances
    activitiesApi.add.mockResolvedValueOnce({})

    const result = await activityValidator(request)

    expect(result).toEqual(validationErrors)
  })
})
