const AgeWeightKeyApi = require('../../src/api/age-weight-key')
const Client = require('../../src/api/client')

jest.mock('../../src/api/client', () => {
  const originalModule = jest.requireActual('../../src/api/client')
  return {
    ...originalModule,
    request: jest.fn(),
    requestFileUpload: jest.fn()
  }
})

describe('age-weight-key', () => {
  beforeEach(jest.clearAllMocks)

  describe('postNew', () => {
    it('calls requestFileUpload with no authentication', async () => {
      await AgeWeightKeyApi.postNew({}, '1999', 'iron-gate', '/path/to/a/file', true)
      expect(Client.requestFileUpload).toHaveBeenCalledWith(
        null,
        expect.any(String),
        expect.any(String),
        expect.any(String)
      )
    })

    it.each([
      ['1996', 'iron-gate'],
      ['2017', 'wooden-gate'],
      ['1999', 'straw-door']
    ])('presents path in correct format', async (year, gate) => {
      await AgeWeightKeyApi.postNew({}, year, gate, '/path/to/a/file', true)
      expect(Client.requestFileUpload).toHaveBeenCalledWith(
        null,
        expect.stringMatching(`reporting/reference/grilse-probabilities/${year}/${gate}`),
        expect.any(String),
        expect.any(String)
      )
    })

    it.each([
      [true, 'overwrite=true'],
      [false, 'overwrite=false'],
      ['example', 'overwrite=true']
    ])('presents overwrite in correct format', async (overwrite, expected) => {
      await AgeWeightKeyApi.postNew({}, '1999', 'iron-gate', '/path/to/a/file', overwrite)
      expect(Client.requestFileUpload).toHaveBeenCalledWith(
        null,
        expect.any(String),
        expect.stringMatching(expected),
        expect.any(String)
      )
    })

    it.each([
      ['/path/to/a/file'],
      ['/path/to/another/file'],
      ['/path/to/a/test/file']
    ])('presents file path in correct format', async (filePath) => {
      await AgeWeightKeyApi.postNew({}, '1999', 'iron-gate', filePath, true)
      expect(Client.requestFileUpload).toHaveBeenCalledWith(
        null,
        expect.any(String),
        expect.any(String),
        expect.stringMatching(filePath)
      )
    })

    it('returns the value of Client.requestFileUpload', async () => {
      const returnValue = Symbol('return value')
      Client.requestFileUpload.mockReturnValueOnce(returnValue)
      const ret = await AgeWeightKeyApi.postNew({}, '1999', 'iron-gate', '/path', true)
      expect(ret).toEqual(returnValue)
    })
  })

  describe('getByYear', () => {
    it('calls request with no authentication', async () => {
      await AgeWeightKeyApi.getByYear({}, '1999')
      expect(Client.request).toHaveBeenCalledWith(
        null,
        expect.any(String),
        expect.any(String)
      )
    })

    it('presents client.method.GET in correct format', async () => {
      await AgeWeightKeyApi.getByYear({}, '1999')
      expect(Client.request).toHaveBeenCalledWith(
        null,
        expect.stringMatching('GET'),
        expect.any(String)
      )
    })

    it.each([
      ['1996'],
      ['2017'],
      ['1999']
    ])('presents path in correct format', async (year) => {
      await AgeWeightKeyApi.getByYear({}, year)
      expect(Client.request).toHaveBeenCalledWith(
        null,
        expect.any(String),
        expect.stringMatching(`reporting/reference/grilse-probabilities/${year}`)
      )
    })

    it('returns the value of Client.request', async () => {
      const returnValue = Symbol('return value')
      Client.request.mockReturnValueOnce(returnValue)
      const ret = await AgeWeightKeyApi.getByYear({}, '1999')
      expect(ret).toEqual(returnValue)
    })
  })
})
