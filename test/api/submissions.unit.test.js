const SubmissionsApi = require('../../src/api/submissions')
const EntityApi = require('../../src/api/entity-api')

describe('submissions.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  describe('constructor', () => {
    it('maps API response into formatted object', async () => {
      const input = {
        _links: {
          self: {
            href: 'https://local/api/submissions/2'
          }
        },
        name: 'Sub 1',
        season: 2025
      }

      const submissionsApi = new SubmissionsApi()
      const result = await submissionsApi.doMap({}, input)

      expect(result).toEqual({
        id: 'submissions/2',
        name: 'Sub 1',
        season: 2025
      })
    })
  })

  describe('add', () => {
    it.each([
      ['WEB', 'angler', 'ANGLER'],
      ['PAPER', 'admin', 'FMT']
    ])('calls super.add with source as %s if it is the %s frontend', async (source, _, context) => {
      process.env.CONTEXT = context
      const superAddMock = EntityApi.prototype.add = jest.fn()
      const request = {}

      const submissionsApi = new SubmissionsApi()
      await submissionsApi.add(request, 'contact-1', 2025)

      expect(superAddMock).toHaveBeenCalledWith(
        request,
        {
          contactId: 'contact-1',
          season: 2025,
          status: 'INCOMPLETE',
          source
        }
      )
    })
  })

  describe('getByContactIdAndYear', () => {
    it('should call super.searchFunction', async () => {
      const superSearchFunctionMock = EntityApi.prototype.searchFunction = jest.fn()
      const request = {}

      const submissionsApi = new SubmissionsApi()
      await submissionsApi.getByContactIdAndYear(request, 'contact-1', 2025)

      expect(superSearchFunctionMock).toHaveBeenCalledWith(
        request,
        'getByContactIdAndSeason',
        'contact_id=contact-1&season=2025'
      )
    })
  })

  describe('getByContactId', () => {
    it('should call super.searchFunction', async () => {
      const superSearchFunctionMock = EntityApi.prototype.searchFunction = jest.fn()
      const request = {}

      const submissionsApi = new SubmissionsApi()
      await submissionsApi.getByContactId(request, 'contact-1')

      expect(superSearchFunctionMock).toHaveBeenCalledWith(
        request,
        'findByContactId',
        'contact_id=contact-1'
      )
    })
  })

  describe('setSubmitted', () => {
    it('should call super.change', async () => {
      const superChangeMock = EntityApi.prototype.change = jest.fn()
      const request = {}

      const submissionsApi = new SubmissionsApi()
      await submissionsApi.setSubmitted(request, 'submission/1')

      expect(superChangeMock).toHaveBeenCalledWith(
        request,
        'submission/1',
        { status: 'SUBMITTED' }
      )
    })
  })

  describe('setIncomplete', () => {
    it('should call super.change', async () => {
      const superChangeMock = EntityApi.prototype.change = jest.fn()
      const request = {}

      const submissionsApi = new SubmissionsApi()
      await submissionsApi.setIncomplete(request, 'submission/1')

      expect(superChangeMock).toHaveBeenCalledWith(
        request,
        'submission/1',
        { status: 'INCOMPLETE' }
      )
    })
  })

  describe('changeExclusion', () => {
    it('should call super.change', async () => {
      const superChangeMock = EntityApi.prototype.change = jest.fn()
      const request = {}

      const submissionsApi = new SubmissionsApi()
      await submissionsApi.changeExclusion(request, 'submission/1', true)

      expect(superChangeMock).toHaveBeenCalledWith(
        request,
        'submission/1',
        { reportingExclude: true }
      )
    })
  })
})
