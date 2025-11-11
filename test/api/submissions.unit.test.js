const SubmissionsApi = require('../../src/api/submissions')

describe('submissions.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
})
