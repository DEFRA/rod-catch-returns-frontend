const CachedEntityApi = require('../../src/api/cached-entity-api')
const EntityApi = require('../../src/api/entity-api')
const Client = require('../../src/api/client')

jest.mock('../../src/api/entity-api')
jest.mock('../../src/api/client')

describe('CachedEntityApi', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const getMockRequest = () => ({ headers: { authorization: 'Bearer token' } })
  const getMockEntities = () => ([
    { id: 1, name: 'A' },
    { id: 2, name: 'B' }
  ])
  const getMockMappedEntities = () => ([
    { id: 1, label: 'A-mapped' },
    { id: 2, label: 'B-mapped' }
  ])

  const createInstance = () => {
    const instance = new CachedEntityApi()
    instance.path = 'testpath'
    instance.mapper = jest.fn(async (_req, entity) => ({
      id: entity.id,
      label: `${entity.name}-mapped`
    }))
    return instance
  }

  it('should fetch and cache data when cache is empty', async () => {
    const mockRequest = getMockRequest()
    const mockAuth = { accessToken: 'auth-token' }
    const mockEntities = getMockEntities()
    const mockMappedEntities = getMockMappedEntities()
    Client.request.mockResolvedValue({
      _embedded: { testpath: mockEntities }
    })
    EntityApi.getAuth.mockResolvedValue(mockAuth)
    const instance = createInstance()

    const result = await instance.list(mockRequest)

    expect(EntityApi.getAuth).toHaveBeenCalledWith(mockRequest)
    expect(Client.request).toHaveBeenCalledWith(mockAuth, 'GET', 'testpath')
    expect(instance.mapper).toHaveBeenCalledTimes(2)
    expect(result).toEqual(mockMappedEntities)
  })

  it('should return cached data on subsequent calls without calling Client.request again', async () => {
    const mockRequest = getMockRequest()
    const instance = createInstance()
    const mockMappedEntities = getMockMappedEntities()
    const mockEntities = getMockEntities()
    Client.request.mockResolvedValue({
      _embedded: { testpath: mockEntities }
    })

    // make first request, which fetchs the data
    await instance.list(mockRequest)
    // second request returns cached data
    const result = await instance.list(mockRequest)

    expect(Client.request).toHaveBeenCalledTimes(1)
    expect(instance.mapper).toHaveBeenCalledTimes(2) // 2 items are in the array
    expect(result).toEqual(mockMappedEntities)
  })

  it('should clear cache after TTL and refetch data', async () => {
    jest.useFakeTimers()

    const mockRequest = getMockRequest()
    const mockEntities = getMockEntities()
    Client.request.mockResolvedValue({
      _embedded: { testpath: mockEntities }
    })
    const instance = createInstance()

    // make first request, which fetchs the data and stores in the cache
    await instance.list(mockRequest)
    expect(Client.request).toHaveBeenCalledTimes(1)

    // Fast-forward 61 minutes
    jest.advanceTimersByTime(1000 * 60 * 61)

    // Cache should now be cleared
    Client.request.mockResolvedValueOnce({
      _embedded: { testpath: [{ id: 3, name: 'C' }] }
    })
    instance.mapper.mockResolvedValueOnce({ id: 3, label: 'C-mapped' })
    const result = await instance.list(mockRequest)
    expect(Client.request).toHaveBeenCalledTimes(2)
    expect(result).toEqual([{ id: 3, label: 'C-mapped' }])

    jest.useRealTimers()
  })
})
