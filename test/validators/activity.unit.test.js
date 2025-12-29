const activityValidator = require('../../src/validators/activity')
const ActivitiesApi = require('../../src/api/activities')
const Common = require('../../src/validators/common')

jest.mock('../../src/api/activities')
jest.mock('../../src/validators/common')

describe('activity.unit', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  const getMockRequest = (
    cacheObj = {
      submissionId: 'sub-1'
    },
    payload = {
      river: 'r1',
      daysFishedOther: 1,
      daysFishedWithMandatoryRelease: 2
    }) => {
    const cache = {
      get: jest.fn().mockResolvedValue(cacheObj)
    }

    return {
      payload,
      cache: jest.fn(() => cache)
    }
  }

  const setupCommonMocks = () => {
    Common.checkNumber
      .mockImplementationOnce(() => 1)
      .mockImplementationOnce(() => 2)

    Common.subNumber
      .mockImplementationOnce((v) => v)
      .mockImplementationOnce((v) => v)
  }

  it('should return null if validation succeeds', async () => {
    setupCommonMocks()
    const request = getMockRequest()

    const [activitiesApi] = ActivitiesApi.mock.instances
    activitiesApi.add.mockResolvedValueOnce({})

    const result = await activityValidator(request)

    expect(result).toBe(null)
  })

  it('should call checkNumber for daysFishedOther', async () => {
    setupCommonMocks()
    const request = getMockRequest()

    const [activitiesApi] = ActivitiesApi.mock.instances
    activitiesApi.add.mockResolvedValueOnce({})

    await activityValidator(request)

    expect(Common.checkNumber).toHaveBeenCalledWith(
      'daysFishedOther',
      1,
      expect.any(Array)
    )
  })

  it('should call checkNumber with daysFishedWithMandatoryRelease', async () => {
    setupCommonMocks()
    const request = getMockRequest()

    const [activitiesApi] = ActivitiesApi.mock.instances
    activitiesApi.add.mockResolvedValueOnce({})

    await activityValidator(request)

    expect(Common.checkNumber).toHaveBeenCalledWith(
      'daysFishedWithMandatoryRelease',
      2,
      expect.any(Array)
    )
  })

  it('should call activitiesApi.add when no activity exists in cache', async () => {
    setupCommonMocks()
    const request = getMockRequest()
    const [activitiesApi] = ActivitiesApi.mock.instances
    activitiesApi.add.mockResolvedValueOnce({})

    await activityValidator(request)

    expect(activitiesApi.add).toHaveBeenCalledWith(
      request,
      'sub-1',
      'r1',
      2,
      1
    )
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
    activitiesApi.change.mockResolvedValueOnce(1)

    await activityValidator(request)

    expect(activitiesApi.change).toHaveBeenCalledWith(
      request,
      'act-1',
      'sub-1',
      'r1',
      2,
      1
    )
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

    Common.subNumber.mockImplementationOnce((v) => v)
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

    Common.subNumber.mockImplementationOnce((v) => v)
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
