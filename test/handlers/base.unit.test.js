const BaseHandler = require('../../src/handlers/base')
const { getMockH } = require('../test-utils/server-test-utils')
const ResponseError = require('../../src/handlers/response-error')

const getMockRequest = ({ method = 'GET', cacheObj = {}, payload = { foo: 'bar' } } = {}) => {
  return {
    method,
    cache: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue(cacheObj),
      set: jest.fn().mockResolvedValue()
    }),
    payload
  }
}

describe('BaseHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handler', () => {
    it('should call doGet for GET requests (calls doGet)', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ method: 'GET', cacheObj: {}, payload: { foo: 'bar' } })
      const h = getMockH()
      handler.doGet = jest.fn().mockResolvedValue('get-result')
      await handler.handler(mockRequest, h)
      expect(handler.doGet).toHaveBeenCalledWith(mockRequest, h)
    })

    it('should call doGet for GET requests (returns result)', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ method: 'GET', cacheObj: {}, payload: { foo: 'bar' } })
      const h = getMockH()
      handler.doGet = jest.fn().mockResolvedValue('get-result')
      const result = await handler.handler(mockRequest, h)
      expect(result).toBe('get-result')
    })

    it('should call doPost for non-GET requests (calls doPost)', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ method: 'POST', cacheObj: {}, payload: { foo: 'bar' } })
      const h = getMockH()
      handler.doPost = jest.fn().mockResolvedValue('post-result')
      await handler.handler(mockRequest, h)
      expect(handler.doPost).toHaveBeenCalledWith(mockRequest, h, undefined)
    })

    it('should call doPost for non-GET requests (returns result)', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ method: 'POST', cacheObj: {}, payload: { foo: 'bar' } })
      const h = getMockH()
      handler.doPost = jest.fn().mockResolvedValue('post-result')
      const result = await handler.handler(mockRequest, h)
      expect(result).toBe('post-result')
    })
  })

  describe('writeCacheAndRedirect', () => {
    it('should write errors and payload to cache', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = {}
      const mockRequest = getMockRequest({ cacheObj, payload: { foo: 'bar' } })
      const h = getMockH()
      h.redirect = jest.fn().mockReturnValue('redirected')
      const errors = ['error']
      await handler.writeCacheAndRedirect(mockRequest, h, errors, '/success', '/error')
      expect(cacheObj.testContext.errors).toBe(errors)
    })

    it('should write payload to cache', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = {}
      const mockRequest = getMockRequest({ cacheObj, payload: { foo: 'bar' } })
      const h = getMockH()
      h.redirect = jest.fn().mockReturnValue('redirected')
      const errors = ['error']
      await handler.writeCacheAndRedirect(mockRequest, h, errors, '/success', '/error')
      expect(cacheObj.testContext.payload).toEqual({ foo: 'bar' })
    })

    it('should redirect to errorPath', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = {}
      const mockRequest = getMockRequest({ cacheObj, payload: { foo: 'bar' } })
      const h = getMockH()
      h.redirect = jest.fn().mockReturnValue('redirected')
      const errors = ['error']
      await handler.writeCacheAndRedirect(mockRequest, h, errors, '/success', '/error')
      expect(h.redirect).toHaveBeenCalledWith('/error')
    })

    it('should return redirected result for errorPath', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = {}
      const mockRequest = getMockRequest({ cacheObj, payload: { foo: 'bar' } })
      const h = getMockH()
      h.redirect = jest.fn().mockReturnValue('redirected')
      const errors = ['error']
      const result = await handler.writeCacheAndRedirect(mockRequest, h, errors, '/success', '/error')
      expect(result).toBe('redirected')
    })

    it('should clear context if no errors', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = { testContext: { errors: ['error'], payload: { foo: 'bar' } } }
      const mockRequest = getMockRequest({ cacheObj })
      const h = getMockH()
      h.redirect = jest.fn().mockReturnValue('redirected')
      await handler.writeCacheAndRedirect(mockRequest, h, null, '/success', '/error')
      expect(cacheObj.testContext).toBeUndefined()
    })

    it('should redirect to successPath if no errors', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = { testContext: { errors: ['error'], payload: { foo: 'bar' } } }
      const mockRequest = getMockRequest({ cacheObj })
      const h = getMockH()
      h.redirect = jest.fn().mockReturnValue('redirected')
      await handler.writeCacheAndRedirect(mockRequest, h, null, '/success', '/error')
      expect(h.redirect).toHaveBeenCalledWith('/success')
    })

    it('should return redirected result for successPath', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = { testContext: { errors: ['error'], payload: { foo: 'bar' } } }
      const mockRequest = getMockRequest({ cacheObj })
      const h = getMockH()
      h.redirect = jest.fn().mockReturnValue('redirected')
      const result = await handler.writeCacheAndRedirect(mockRequest, h, null, '/success', '/error')
      expect(result).toBe('redirected')
    })
  })

  describe('readCacheAndDisplayView', () => {
    it('should throw if pageObj is not an object', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ cacheObj: {} })
      const h = getMockH()
      await expect(handler.readCacheAndDisplayView(mockRequest, h, [])).rejects.toThrow('Page object must be an object')
    })

    it('should call h.view with path and pageObj', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ cacheObj: {} })
      const h = getMockH()
      h.view = jest.fn().mockReturnValue('view-result')
      await handler.readCacheAndDisplayView(mockRequest, h, { foo: 'bar' })
      expect(h.view).toHaveBeenCalledWith('viewpath', expect.objectContaining({ foo: 'bar' }))
    })

    it('should return h.view result', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ cacheObj: {} })
      const h = getMockH()
      h.view = jest.fn().mockReturnValue('view-result')
      const result = await handler.readCacheAndDisplayView(mockRequest, h, { foo: 'bar' })
      expect(result).toBe('view-result')
    })

    it('should call h.view with path if pageObj is undefined', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ cacheObj: {} })
      const h = getMockH()
      h.view = jest.fn().mockReturnValue('view-result')
      await handler.readCacheAndDisplayView(mockRequest, h)
      expect(h.view).toHaveBeenCalledWith('viewpath')
    })

    it('should return h.view result if pageObj is undefined', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ cacheObj: {} })
      const h = getMockH()
      h.view = jest.fn().mockReturnValue('view-result')
      const result = await handler.readCacheAndDisplayView(mockRequest, h)
      expect(result).toBe('view-result')
    })

    it('should throw if pageObj is an array', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ cacheObj: {} })
      const h = getMockH()
      await expect(handler.readCacheAndDisplayView(mockRequest, h, [])).rejects.toThrow('Page object must be an object')
    })

    it('should throw if pageObj is not an object', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ cacheObj: {} })
      const h = getMockH()
      await expect(handler.readCacheAndDisplayView(mockRequest, h, 'not-an-object')).rejects.toThrow('Page object must be an object')
    })

    it('should merge payload from cache into pageObj', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = { testContext: { payload: { foo: 'bar' } } }
      const mockRequest = getMockRequest({ cacheObj })
      const h = getMockH()
      h.view = jest.fn().mockReturnValue('view-result')
      await handler.readCacheAndDisplayView(mockRequest, h, { baz: 'qux' })
      expect(h.view).toHaveBeenCalledWith('viewpath', expect.objectContaining({
        baz: 'qux',
        payload: { foo: 'bar' }
      }))
    })
  })

  describe('getCacheContext', () => {
    it('should return context from cache', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ cacheObj: { testContext: { foo: 'bar' } } })
      const result = await handler.getCacheContext(mockRequest)
      expect(result).toEqual({ foo: 'bar' })
    })
  })

  describe('setCacheContext', () => {
    it('should set context in cache', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = {}
      const mockRequest = getMockRequest({ cacheObj })
      await handler.setCacheContext(mockRequest, { foo: 'bar' })
      expect(cacheObj.testContext).toEqual({ foo: 'bar' })
    })
  })

  describe('clearCacheErrors', () => {
    it('should remove errors from context in cache', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = { testContext: { errors: ['error'] } }
      const mockRequest = getMockRequest({ cacheObj })
      await handler.clearCacheErrors(mockRequest)
      expect(cacheObj.testContext.errors).toBeUndefined()
    })
  })

  describe('clearCachePayload', () => {
    it('should remove payload from context in cache', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = { testContext: { payload: { foo: 'bar' } } }
      const mockRequest = getMockRequest({ cacheObj })
      await handler.clearCachePayload(mockRequest)
      expect(cacheObj.testContext.payload).toBeUndefined()
    })
  })

  describe('clearCacheErrorsAndPayload', () => {
    it('should remove context from cache', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const cacheObj = { testContext: { errors: ['error'], payload: { foo: 'bar' } } }
      const mockRequest = getMockRequest({ cacheObj })
      await handler.clearCacheErrorsAndPayload(mockRequest)
      expect(cacheObj.testContext).toBeUndefined()
    })
  })

  describe('errors', () => {
    it('should redirect to error page for ResponseError.Error', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ method: 'GET' })
      const h = getMockH()
      const error = new ResponseError.Error('fail', 400)
      handler.doGet = jest.fn().mockImplementation(() => { throw error })
      h.redirect = jest.fn().mockReturnValue('redirected')
      await handler.handler(mockRequest, h)
      expect(h.redirect).toHaveBeenCalledWith('/error/400')
    })

    it('should return redirected result for ResponseError.Error', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ method: 'GET' })
      const h = getMockH()
      const error = new ResponseError.Error('fail', 400)
      handler.doGet = jest.fn().mockImplementation(() => { throw error })
      h.redirect = jest.fn().mockReturnValue('redirected')
      const result = await handler.handler(mockRequest, h)
      expect(result).toBe('redirected')
    })

    it('should throw non-ResponseError errors', async () => {
      const handler = new BaseHandler(['viewpath', null, 'testContext'])
      const mockRequest = getMockRequest({ method: 'GET' })
      const h = getMockH()
      handler.doGet = jest.fn().mockImplementation(() => { throw new Error('error') })
      await expect(handler.handler(mockRequest, h)).rejects.toThrow('error')
    })
  })
})
