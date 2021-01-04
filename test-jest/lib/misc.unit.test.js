const mockMkDir = jest.fn()

const { logger } = require('defra-logging-facade')

const misc = require('../../src/lib/misc')

jest.mock('fs', () => {
  return {
    mkdir: mockMkDir
  }
})
jest.mock('defra-logging-facade')

describe('misc', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkTempDir', () => {
    it('should resolve if it can successfully create a temp directory', async () => {
      mockMkDir.mockImplementation((path, params, callback) => callback())
      await expect(misc.checkTempDir('temp')).resolve
      expect(logger.info).toHaveBeenCalledWith('Created temporary file directory: temp')
    })

    it('should throw an error if it cannot create a temp directory', async () => {
      mockMkDir.mockImplementation((path, params, callback) => callback(new Error('error')))
      await expect(misc.checkTempDir('temp')).rejects.toThrow('error')
      expect(logger.error).toHaveBeenCalledWith(new Error('error'))
    })

    /* eslint standard/no-callback-literal: 0 */
    it('should resolve if the temp directory already exists', async () => {
      mockMkDir.mockImplementation((path, params, callback) => callback({ code: 'EEXIST' }))
      await expect(misc.checkTempDir('temp')).resolves
      expect(logger.info).toHaveBeenCalledWith('Using temporary file directory: temp')
    })
  })
})
