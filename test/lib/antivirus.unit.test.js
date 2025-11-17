const NodeClam = require('clamscan')
const antivirus = require('../../src/lib/antivirus')
const logger = require('../../src/lib/logger-utils')

jest.mock('clamscan')
jest.mock('../../src/lib/logger-utils')

describe('antivirus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('retryAntiVirusInit', () => {
    it('should return the value of init if clamscan has been initialised', async () => {
      const mockInit = jest.fn()
      NodeClam.prototype.init = mockInit
      mockInit.mockReturnValue(Promise.resolve(1))

      await expect(antivirus.retryAntiVirusInit({}, 1, 1)).resolves.toBe(1)
    })

    it('should throw an error if clamscan does not initialise', async () => {
      const mockInit = jest.fn()
      NodeClam.prototype.init = mockInit
      mockInit.mockReturnValue(Promise.reject(new Error('error')))

      await expect(antivirus.retryAntiVirusInit({}, 1, 1)).rejects.toThrow(Error)
    })

    it('should call init again if clamscan does not start', async () => {
      const mockInit = jest.fn()
      NodeClam.prototype.init = mockInit
      mockInit.mockReturnValue(Promise.reject(new Error('error')))

      await expect(antivirus.retryAntiVirusInit({}, 3, 1)).rejects.toThrow(Error)

      expect(mockInit).toHaveBeenCalledTimes(4)
      expect(logger.info).toHaveBeenNthCalledWith(1, 'Unable to find virus scanner - retries left 3')
      expect(logger.info).toHaveBeenNthCalledWith(2, 'Unable to find virus scanner - retries left 2')
      expect(logger.info).toHaveBeenNthCalledWith(3, 'Unable to find virus scanner - retries left 1')
    })

    it('should call init again if clamscan does not start, then if it does start within the retry limit the value of init should be returned', async () => {
      const mockInit = jest.fn()
      NodeClam.prototype.init = mockInit
      mockInit.mockReturnValueOnce(Promise.reject(new Error('error')))
        .mockReturnValueOnce(Promise.resolve(1))

      await expect(antivirus.retryAntiVirusInit({}, 5, 1)).resolves.toBe(1)

      expect(mockInit).toHaveBeenCalledTimes(2)
      expect(logger.info).toHaveBeenCalledTimes(1)
    })
  })
})
