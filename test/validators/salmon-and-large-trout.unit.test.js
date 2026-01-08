const mockGetById = jest.fn()
const mockGetActivities = jest.fn()
const mockAdd = jest.fn()
const mockChange = jest.fn()
const mockSorter = jest.fn(() => 0)
const mockApiErrors = jest.fn()

const validate = require('../../src/validators/salmon-and-large-trout')
const moment = require('moment')

// TODO change these mocks to match other files e.g. this should be SubmissionsApi.getById
jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetById
  }))
})

jest.mock('../../src/api/activities', () => {
  return jest.fn().mockImplementation(() => ({
    getFromLink: mockGetActivities
  }))
})

jest.mock('../../src/api/catches', () => {
  return jest.fn().mockImplementation(() => ({
    add: mockAdd,
    change: mockChange
  }))
})

jest.mock('../../src/validators/common', () => ({
  getSorterForApiErrors: () => mockSorter,
  apiErrors: (...args) => mockApiErrors(...args)
}))

describe('salmon-and-large-trout.unit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const getMockRequest = (payload, cacheObj) => {
    const cacheApi = {
      get: jest.fn().mockResolvedValue(cacheObj)
    }
    return {
      payload,
      cache: jest.fn(() => cacheApi)
    }
  }

  // TODO use object instead of array
  it.each([
    [{ month: null, day: '10' }, 'missing month'],
    [{ month: '5', day: null }, 'missing day'],
    [{ month: 'abc', day: '10' }, 'non-numeric month'],
    [{ month: '5', day: 'xyz' }, 'non-numeric day'],
    [{ month: '2', day: '31' }, 'invalid date']
  ])('dateCaught is null when %s', async (payload) => {
    const request = getMockRequest(payload, { year: 2025, submissionId: 'sub1' })
    mockGetById.mockResolvedValueOnce({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValueOnce([{ id: 'a1', river: { id: payload.river || 'r1' } }])
    mockAdd.mockResolvedValueOnce({})

    await validate(request)

    expect(mockAdd).toHaveBeenCalledWith(expect.any(Object), expect.any(String), undefined,
      null, // 4th value is dateCaught
      undefined, expect.any(Object), undefined, null, expect.any(Boolean), expect.any(Boolean))
  })

  it('returns ISO date string for valid date', async () => {
    const payload = { month: '5', day: '10', river: 'r1' }
    const request = getMockRequest(payload, { year: 2025, submissionId: 'sub1' })
    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    mockAdd.mockResolvedValueOnce({})

    await validate(request)

    expect(mockAdd).toHaveBeenCalledWith(expect.any(Object), expect.any(String), 'a1',
      '2025-05-10T00:00:00+01:00', // 4th value is dateCaught
      undefined, expect.any(Object), undefined, null, expect.any(Boolean), expect.any(Boolean))
  })

  it('converts METRIC to IMPERIAL when no errors', async () => {
    const payload = {
      system: 'METRIC',
      kilograms: '1',
      river: 'r1'
    }
    const request = getMockRequest(payload, { year: 2025, submissionId: 'sub1' })
    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    mockAdd.mockResolvedValue({})

    await validate(request)

    expect(payload).toStrictEqual({
      system: 'METRIC',
      kilograms: '1',
      river: 'r1',
      pounds: 2,
      ounces: 3
    })
  })

  it('converts IMPERIAL to METRIC when no errors', async () => {
    const payload = {
      system: 'IMPERIAL',
      pounds: '2',
      ounces: '8',
      river: 'r1'
    }
    const request = getMockRequest(payload, { year: 2025, submissionId: 'sub1' })
    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    mockAdd.mockResolvedValue({})

    await validate(request)

    expect(payload).toStrictEqual({
      system: 'IMPERIAL',
      pounds: '2',
      ounces: '8',
      river: 'r1',
      kilograms: 1.134
    })
  })

  it('set released to true if it is true (string)', async () => {
    const payload = { river: 'r1', released: 'true' }
    const request = getMockRequest(payload, { year: 2025, submissionId: 'sub1' })
    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    mockAdd.mockResolvedValueOnce({})

    await validate(request)

    expect(mockAdd).toHaveBeenCalledWith(expect.any(Object), expect.any(String), 'a1', null, undefined, expect.any(Object), undefined,
      true,
      expect.any(Boolean), expect.any(Boolean))
  })

  it('set released to false if it is true (boolean)', async () => {
    // This doesn't make sense
    const payload = { river: 'r1', released: true }
    const request = getMockRequest(payload, { year: 2025, submissionId: 'sub1' })
    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    mockAdd.mockResolvedValueOnce({})

    await validate(request)

    expect(mockAdd).toHaveBeenCalledWith(expect.any(Object), expect.any(String), 'a1', null, undefined, expect.any(Object), undefined,
      false,
      expect.any(Boolean), expect.any(Boolean))
  })

  it.each([
    { payload: { released: false }, description: 'false (boolean)' },
    { payload: { released: '' }, description: 'an empty string' },
    { payload: { released: undefined }, description: 'undefined' }
  ])('set released to null if it is $description', async ({ payload }) => {
    const request = getMockRequest(payload, { year: 2025, submissionId: 'sub1' })
    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    mockAdd.mockResolvedValueOnce({})

    await validate(request)

    expect(mockAdd).toHaveBeenCalledWith(expect.any(Object), expect.any(String), undefined, null, undefined, expect.any(Object), undefined,
      null,
      expect.any(Boolean), expect.any(Boolean))
  })

  it('calls add when cache.largeCatch is missing', async () => {
    const payload = { river: 'r1', month: '5', day: '10' }
    const request = getMockRequest(payload, { submissionId: 'sub1', year: 2025 })
    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    mockAdd.mockResolvedValue({})

    await validate(request)

    expect(mockAdd).toHaveBeenCalled()
  })

  it('calls change when cache.largeCatch exists', async () => {
    const payload = { river: 'r1', month: '5', day: '10' }
    const request = getMockRequest(payload, {
      submissionId: 'sub1',
      year: 2025,
      largeCatch: { id: 'catch123' }
    })
    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    mockChange.mockResolvedValue({})

    await validate(request)

    expect(mockChange).toHaveBeenCalled()
  })

  it('returns sorted API errors when result contains errors', async () => {
    const payload = { river: 'r1', month: '5', day: '10' }
    const request = getMockRequest(payload, { submissionId: 'sub1', year: 2025 })
    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    const apiErr = { errors: [{ MASS: 'BAD' }] }
    mockAdd.mockResolvedValue(apiErr)
    mockApiErrors.mockReturnValue([{ MASS: 'BAD' }])

    const result = await validate(request)

    expect(result).toEqual([{ MASS: 'BAD' }])
    expect(mockApiErrors).toHaveBeenCalledWith(apiErr)
  })

  it('returns null when no errors and API success', async () => {
    const payload = { river: 'r1', month: '5', day: '10' }
    const request = getMockRequest(payload, { submissionId: 'sub1', year: 2025 })

    mockGetById.mockResolvedValue({ _links: { activities: { href: '/acts' } } })
    mockGetActivities.mockResolvedValue([{ id: 'a1', river: { id: 'r1' } }])
    mockAdd.mockResolvedValue({})

    const result = await validate(request)

    expect(result).toBeNull()
  })
})
