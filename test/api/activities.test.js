const mockGetFromLink = jest.fn()
const mockRequest = jest.fn()
const ActivitiesApi = require('../../src/api/activities')

jest.mock('../../src/api/rivers', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getFromLink: mockGetFromLink
    }
  })
})

jest.mock('../../src/api/client', () => {
  const originalModule = jest.requireActual('../../src/api/client')
  return {
    ...originalModule,
    request: mockRequest
  }
})

describe('activities', () => {
  beforeEach(jest.clearAllMocks)

  it('sets path to "activities"', () => {
    const activitiesApi = new ActivitiesApi()
    expect(activitiesApi.path).toEqual('activities')
  })

  describe('mapper', () => {
    it.each([
      ['http://example.com/api/to/somewhere', 'to/somewhere'],
      ['http://example.com/api/to/the/dark/side', 'to/the/dark/side']

    ])('sets id properly', async (href, expectedValue) => {
      const activitiesApi = new ActivitiesApi()
      mockGetFromLink.mockImplementationOnce(() => ({ _links: { self: { href: href } } }))
      const mapped = await activitiesApi.doMap(({ }), createMockContext({ href }))
      expect(mapped.id).toEqual(expectedValue)
    })

    it.each([
      [1, 1],
      [10, 10],
      [0, 0]
    ])('sets days fished with no release', async (daysFished, expectedValue) => {
      const activitiesApi = new ActivitiesApi()
      mockGetFromLink.mockImplementationOnce(() => ({ _links: { self: { href: 'http://example.com/path/to/somewhere' } } }))
      const mapped = await activitiesApi.doMap(({ }), createMockContext({ href: 'http://example.com/path/to/somewhere', daysFishedOther: daysFished }))
      expect(mapped.daysFishedOther).toEqual(expectedValue)
    })

    it.each([
      [1, 1],
      [10, 10],
      [0, 0]
    ])('sets days fished with mand release', async (daysFishedMand, expectedValue) => {
      const activitiesApi = new ActivitiesApi()
      mockGetFromLink.mockImplementationOnce(() => ({ _links: { self: { href: 'http://example.com/path/to/somewhere' } } }))
      const mapped = await activitiesApi.doMap(({ }), createMockContext({ href: 'http://example.com/path/to/somewhere', daysFishedWithMandatoryRelease: daysFishedMand }))
      expect(mapped.daysFishedWithMandatoryRelease).toEqual(expectedValue)
    })

    it.each([
      ['http://example.com/api/to/somewhere', 'to/somewhere'],
      ['http://example.com/api/to/the/dark/side', 'to/the/dark/side']
    ])('sets river id to correct value', async (href, expectedValue) => {
      const activitiesApi = new ActivitiesApi()
      mockGetFromLink.mockImplementationOnce(() => ({ _links: { self: { href: href } } }))
      const mapped = await activitiesApi.doMap(({ }), createMockContext({ href }))
      expect(mapped.river.id).toEqual(expectedValue)
    })

    it.each([
      ['Tyne', 'Tyne'],
      ['Barry', 'Barry'],
      ['Usk', 'Usk']
    ])('sets river name value', async (riverName, expectedValue) => {
      const activitiesApi = new ActivitiesApi()
      mockGetFromLink.mockImplementationOnce(() => ({ _links: { self: { href: 'http://example.com/path/to/somewhere' } }, name: riverName }))
      const mapped = await activitiesApi.doMap(({ }), createMockContext({ href: 'http://example.com/path/to/somewhere', riverName }))
      expect(mapped.river.name).toEqual(expectedValue)
    })

    it.each([
      ['Tyne', 'Tyne'],
      ['Barry', 'Barry'],
      ['Usk', 'Usk']
    ])('sets river internal value', async (riverInternal, expectedValue) => {
      const activitiesApi = new ActivitiesApi()
      mockGetFromLink.mockImplementationOnce(() => ({ _links: { self: { href: 'http://example.com/path/to/somewhere' } }, internal: riverInternal }))
      const mapped = await activitiesApi.doMap(({ }), createMockContext({ href: 'http://example.com/path/to/somewhere', riverInternal }))
      expect(mapped.river.internal).toEqual(expectedValue)
    })

    it.each([
      ['http://example.com/path/to/somewhere', '/path', 'Tyne', 'internal'],
      ['http://example.com/unwise/path/to/the/dark/side', 'the', 'Tyne', 'internal'],
      ['http://example.com/unwise/path/to/the/dark/side/', 'side', 'Tyne', 'internal']
    ])('sets the _links attribute values id, name and internal', async (href, apiPath, name, internal) => {
      process.env.API_PATH = apiPath
      const activitiesApi = new ActivitiesApi()
      mockGetFromLink.mockImplementationOnce(() => ({ _links: { self: { href: href } } }))
      const mapped = await activitiesApi.doMap(({ }), createMockContext({ href, name, internal }))
      expect(mapped._links).toMatchSnapshot()
    })
  })

  describe('add', () => {
    it('should display the authentication page', async () => {
      const activitiesApi = new ActivitiesApi()
      const request = getSampleRequest()
      const href = 'http://example.com/path/to/somewhere'
      const submissionId = '1'
      const river = 'Goyt'
      const daysFishedWithMandatoryRelease = 1
      const daysFishedOther = 1
      mockRequest.mockImplementationOnce(() => ({ id: '1', _links: { self: { href: href } }, river, daysFishedOther, daysFishedWithMandatoryRelease }))
      const result = await activitiesApi.add(request, { submissionId, river, daysFishedWithMandatoryRelease, daysFishedOther })
      expect(result.id).toMatchSnapshot()
    })

    it('when adding new river it should return the ID as the original input if errors are found in the request', async () => {
      const activitiesApi = new ActivitiesApi()
      const request = getSampleRequest()
      const errors = 'errors'
      const href = 'http://example.com/path/to/somewhere'
      const originalSub = 'original ID'
      const submissionId = 'new ID'
      const river = 'Goyt'
      const daysFishedWithMandatoryRelease = 1
      const daysFishedOther = 1
      mockRequest.mockImplementationOnce(() => ({ id: originalSub, errors, _links: { self: { href: href } }, river, daysFishedOther, daysFishedWithMandatoryRelease }))
      const result = await activitiesApi.add(request, { submissionId, river, daysFishedWithMandatoryRelease, daysFishedOther })
      expect(result.id).toEqual(originalSub)
    })
  })

  describe('change', () => {
    it('should change the days', async () => {
      const activitiesApi = new ActivitiesApi()
      const request = getSampleRequest()
      const href = 'http://example.com/path/to/somewhere'
      const activityId = '1'
      const submissionId = '1'
      const riverId = '1'
      const daysFishedWithMandatoryRelease = 1
      const daysFishedOther = 1
      mockRequest.mockImplementationOnce(() => ({ id: '1', _links: { self: { href: href } }, activityId, riverId, daysFishedOther, daysFishedWithMandatoryRelease }))
      const result = await activitiesApi.change(request, { submissionId, activityId, riverId, daysFishedWithMandatoryRelease, daysFishedOther })
      expect(result).toMatchSnapshot()
    })

    it('when changing river details it should return the ID as the original input if errors are found in the request', async () => {
      const activitiesApi = new ActivitiesApi()
      const request = getSampleRequest()
      const errors = 'errors'
      const href = 'http://example.com/path/to/somewhere'
      const activityId = '1'
      const originalSubId = 'original'
      const submissionId = 'new ID'
      const riverId = '1'
      const daysFishedWithMandatoryRelease = 1
      const daysFishedOther = 1
      mockRequest.mockImplementationOnce(() => ({ id: originalSubId, errors, _links: { self: { href: href } }, activityId, riverId, daysFishedOther, daysFishedWithMandatoryRelease }))
      const result = await activitiesApi.change(request, { submissionId, activityId, riverId, daysFishedWithMandatoryRelease, daysFishedOther })
      expect(result.id).toEqual(originalSubId)
    })
  })

  describe('sort', () => {
    it.each([
      [['Ouse', 'Derwent', 'Foss'], 'Derwent, Foss, Ouse'],
      [['Lune', 'Mersey', 'Ribble'], 'Lune, Mersey, Ribble'],
      [['Thames', 'Severn', 'Great Ouse'], 'Great Ouse, Severn, Thames'],
      [['Trent', 'Tyne', 'Tay'], 'Tay, Trent, Tyne']
    ])('sorts river data by name', (riversToSort, expectedResult) => {
      const activitiesApi = new ActivitiesApi()
      const arrayToTest = riversToSort.map(riverName => ({
        river: { name: riverName }
      }))
      expect(arrayToTest.sort(activitiesApi.sort).map(riverData => riverData.river.name).join(', ')).toEqual(expectedResult)
    })

    it('keeps data order the same if the same river has been fished several times', () => {
      const activitiesApi = new ActivitiesApi()
      const riverData = [{ river: { name: 'Tweed', dateFished: '2021-07-22' } }, { river: { name: 'Tweed', dateFished: '2021-07-15' } }]
      const result = riverData.sort(activitiesApi.sort)
      expect(result[0].dateFished).toEqual(result[0].dateFished)
    })
  })
})

const getSampleRequest = () => ({
  cache: () => ({
    get: () => ({ authorization: null })
  })
})

const createMockContext = params => {
  const { href, daysFishedOther, daysFishedWithMandatoryRelease, name, riverName, internal } = {
    href: 'http://example.com/path/to/somewhere',
    daysFishedOther: 0,
    daysFishedWithMandatoryRelease: 0,
    name: 'river',
    riverName: 'a river',
    internal: 'internal',
    ...params
  }
  return {
    href,
    daysFishedOther,
    daysFishedWithMandatoryRelease,
    river: {
      href,
      riverName,
      internal
    },
    _links: {
      river: {
        href,
        name,
        internal
      },
      self: {
        href
      }
    }
  }
}
