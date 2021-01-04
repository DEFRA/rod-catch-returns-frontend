const CacheDecorator = require('../../src/lib/cache-decorator')

describe('cache-decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('get', () => {
    it('should resolve and return the result if cache.get is successful', async () => {
      const cacheDecorator = new CacheDecorator()
      const mockGet = jest.fn(() => 'result')
      CacheDecorator.prototype.server = {
        app: {
          cache: {
            get: mockGet
          }
        }
      }
      CacheDecorator.prototype.auth = {
        artifacts: {
          sid: 'abc'
        }
      }

      await expect(cacheDecorator.get()).resolves.toBe('result')

      expect(mockGet).toHaveBeenCalledTimes(1)
    })

    it('should reject and return an error if cache.get is unsuccessful', async () => {
      const cacheDecorator = new CacheDecorator()
      const mockGet = jest.fn(() => { throw new Error() })
      CacheDecorator.prototype.server = {
        app: {
          cache: {
            get: mockGet
          }
        }
      }
      CacheDecorator.prototype.auth = {
        artifacts: {
          sid: 'abc'
        }
      }

      await expect(cacheDecorator.get()).rejects.toThrow(new Error('Cache fetch error'))

      expect(mockGet).toHaveBeenCalledTimes(1)
    })
  })

  describe('set', () => {
    it('should resolve and call cache.set if successful', async () => {
      const cacheDecorator = new CacheDecorator()
      const mockSet = jest.fn(() => {})
      CacheDecorator.prototype.server = {
        app: {
          cache: {
            set: mockSet
          }
        }
      }
      CacheDecorator.prototype.auth = {
        artifacts: {
          sid: '123'
        }
      }
      const obj = { user: 'bob' }

      await expect(cacheDecorator.set(obj)).resolves

      expect(mockSet).toHaveBeenCalledTimes(1)
      expect(mockSet).toBeCalledWith('123', obj)
    })

    it('should reject and return an error if cache.set is unsuccessful', async () => {
      const cacheDecorator = new CacheDecorator()
      const mockSet = jest.fn(() => { throw new Error() })
      CacheDecorator.prototype.server = {
        app: {
          cache: {
            set: mockSet
          }
        }
      }
      CacheDecorator.prototype.auth = {
        artifacts: {
          sid: 'abc'
        }
      }

      await expect(cacheDecorator.set()).rejects.toThrow(new Error('Cache put error'))

      expect(mockSet).toHaveBeenCalledTimes(1)
    })
  })

  describe('drop', () => {
    it('should resolve and call cache.drop if successful', async () => {
      const cacheDecorator = new CacheDecorator()
      const mockDrop = jest.fn(() => {})
      CacheDecorator.prototype.server = {
        app: {
          cache: {
            drop: mockDrop
          }
        }
      }
      CacheDecorator.prototype.auth = {
        artifacts: {
          sid: 'abc'
        }
      }

      await expect(cacheDecorator.drop()).resolves

      expect(mockDrop).toHaveBeenCalledTimes(1)
    })

    it('should reject and return an error if cache.drop is unsuccessful', async () => {
      const cacheDecorator = new CacheDecorator()
      const mockDrop = jest.fn(() => { throw new Error() })
      CacheDecorator.prototype.server = {
        app: {
          cache: {
            drop: mockDrop
          }
        }
      }
      CacheDecorator.prototype.auth = {
        artifacts: {
          sid: 'abc'
        }
      }

      await expect(cacheDecorator.drop()).rejects.toThrow(new Error('Cache drop error'))

      expect(mockDrop).toHaveBeenCalledTimes(1)
    })
  })
})
