const validate = require('../../src/validators/small-catch')
const SubmissionsApi = require('../../src/api/submissions')
const ActivitiesApi = require('../../src/api/activities')
const SmallCatchesApi = require('../../src/api/small-catches')
const MethodsApi = require('../../src/api/methods')

jest.mock('../../src/api/submissions')
jest.mock('../../src/api/activities')
jest.mock('../../src/api/small-catches')
jest.mock('../../src/api/methods')

const [submissionsApi] = SubmissionsApi.mock.instances
const [activitiesApi] = ActivitiesApi.mock.instances
const [smallCatchesApi] = SmallCatchesApi.mock.instances
const [methodsApi] = MethodsApi.mock.instances

describe('small-catch.unit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const getMockRequest = (payload, cacheObj) => {
    const cacheApi = {
      get: jest.fn().mockResolvedValueOnce(cacheObj)
    }
    return {
      payload,
      cache: jest.fn(() => cacheApi)
    }
  }

  const setUpCommonMocks = () => {
    methodsApi.list.mockResolvedValueOnce([
      { id: 'm1', name: 'Fly' },
      { id: 'm2', name: 'Spinner' }
    ])

    submissionsApi.getById.mockResolvedValueOnce({ _links: { activities: { href: '/acts' } } })
    activitiesApi.getFromLink.mockResolvedValueOnce([{ id: 'a1', river: { id: 'r1' } }])
    smallCatchesApi.add.mockResolvedValueOnce({})
    smallCatchesApi.change.mockResolvedValueOnce({})
  }

  it.each([
    { payload: { month: '0' }, description: 'month below range' },
    { payload: { month: '13' }, description: 'month above range' },
    { payload: { month: 'abc' }, description: 'non numeric month' },
    { payload: { month: undefined }, description: 'missing month' }
  ])('sets monthForApi to null when $description', async ({ payload }) => {
    const request = getMockRequest({ ...payload, river: 'r1' }, { submissionId: 'sub1' })
    setUpCommonMocks()

    await validate(request)

    expect(smallCatchesApi.add.mock.calls[0][3]).toBeNull()
  })

  it('passes valid month to API', async () => {
    const payload = { river: 'r1', month: '5' }
    const request = getMockRequest(payload, { submissionId: 'sub1' })
    setUpCommonMocks()

    await validate(request)

    expect(smallCatchesApi.add.mock.calls[0][3]).toBe(5)
  })

  it('builds apiCounts only for numeric non-zero values', async () => {
    const payload = { river: 'r1', fly: '2', spinner: '0' }
    const request = getMockRequest(payload, { submissionId: 'sub1' })
    setUpCommonMocks()

    await validate(request)

    expect(smallCatchesApi.add.mock.calls[0][4]).toEqual([{ method: 'm1', count: '2' }])
  })

  it('pushes frontend validation error for non-numeric count', async () => {
    const payload = { river: 'r1', fly: 'abc' }
    const request = getMockRequest(payload, { submissionId: 'sub1' })
    setUpCommonMocks()

    const result = await validate(request)

    expect(result).toContainEqual({ SmallCatch: 'SMALL_CATCH_FLY_COUNT_INVALID' })
  })

  it('calls add when cache.smallCatch is missing', async () => {
    const payload = { river: 'r1', month: '5' }
    const request = getMockRequest(payload, { submissionId: 'sub1' })
    setUpCommonMocks()

    await validate(request)

    expect(smallCatchesApi.add).toHaveBeenCalled()
    expect(smallCatchesApi.change).not.toHaveBeenCalled()
  })

  it('calls change when cache.smallCatch exists', async () => {
    const payload = { river: 'r1', month: '5' }
    const request = getMockRequest(payload, { submissionId: 'sub1', smallCatch: { id: 'c1' } })
    setUpCommonMocks()

    await validate(request)

    expect(smallCatchesApi.change).toHaveBeenCalled()
  })

  it('passes released flag using subNumber', async () => {
    const payload = { river: 'r1', released: '5' }
    const request = getMockRequest(payload, { submissionId: 'sub1' })
    setUpCommonMocks()

    await validate(request)

    const [, , , , , released] = smallCatchesApi.add.mock.calls[0]
    expect(released).toBe('5')
  })

  it('returns sorted API errors when API fails', async () => {
    const payload = { river: 'r1', fly: '2' }
    const request = getMockRequest(payload, { submissionId: 'sub1' })
    methodsApi.list.mockResolvedValueOnce([
      { id: 'm1', name: 'Fly' },
      { id: 'm2', name: 'Spinner' }
    ])
    submissionsApi.getById.mockResolvedValueOnce({ _links: { activities: { href: '/acts' } } })
    activitiesApi.getFromLink.mockResolvedValueOnce([{ id: 'a1', river: { id: 'r1' } }])
    const apiErr = {
      errors: [
        { entity: 'SMALLCATCH', message: 'BAD' }
      ]
    }
    smallCatchesApi.add.mockResolvedValueOnce(apiErr)

    const result = await validate(request)

    expect(result).toEqual([{ SMALLCATCH: 'BAD' }])
  })

  it('returns null when no errors and API success', async () => {
    const payload = { river: 'r1', fly: '2' }
    const request = getMockRequest(payload, { submissionId: 'sub1' })
    setUpCommonMocks()

    const result = await validate(request)

    expect(result).toBeNull()
  })
})
