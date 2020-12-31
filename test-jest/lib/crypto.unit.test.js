const crypto = require('../../src/lib/crypto')
const CryptoError = crypto.cryptoError

describe('crypto', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('writeObj', () => {
    it('should successfuly encrypt if cache.get is valid', async () => {
      const cache = {
        get: jest.fn(() => ({ data: '1234567891234567' }))
      }
      const obj = { text: 'hello' }
      const result = await crypto.writeObj(cache, obj)
      expect(result).toBeDefined()
    })

    it('should throw an error if data in cache.get is not valid', async () => {
      const cache = {
        get: jest.fn(() => ({ data: '' }))
      }
      const obj = { text: 'hello' }
      await expect(crypto.writeObj(cache, obj)).rejects.toThrow(new CryptoError('Encryption errorError: Invalid IV length'))
    })

    it('should throw an error if cache.get is empty', async () => {
      const cache = {
        get: jest.fn(() => {})
      }
      const obj = { text: 'hello' }
      await expect(crypto.writeObj(cache, obj)).rejects.toThrow(new CryptoError('Encryption errorCrypto error: Expected hub identifier'))
    })
  })

  describe('readObj', () => {
    it('should successfuly encrypt if cache.get is valid', async () => {
      const cache = {
        get: jest.fn(() => ({ data: '1234567891234567' }))
      }
      const obj = 'kNfiEJLQbW1+IByOdC2T3rjovUdpiPJmBFR+9sTIf3U='
      const result = await crypto.readObj(cache, obj)
      expect(result).toBeDefined()
    })

    it('should throw an error if data in cache.get is not valid', async () => {
      const cache = {
        get: jest.fn(() => ({ data: '' }))
      }
      const obj = { text: 'hello' }
      await expect(crypto.readObj(cache, obj)).rejects.toThrow(new CryptoError('Deserialization error'))
    })

    it('should throw an error if cache.get is empty', async () => {
      const cache = {
        get: jest.fn(() => {})
      }
      const obj = { text: 'hello' }
      await expect(crypto.readObj(cache, obj)).rejects.toThrow(new CryptoError('Deserialization error'))
    })
  })
})
