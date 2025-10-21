const EntityApi = require('../../src/api/entity-api')
const Client = require('../../src/api/client')

jest.mock('../../src/api/client')

const getMockRequest = (getValue = {
  authorization: {
    token: 'test-token',
    name: 'Test User'
  }
}) => ({
  cache: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(getValue)
  })
})

describe('entity-api', () => {
  describe('getAuth', () => {
    test('should return the authorization token when it exists in cache', async () => {
      const mockRequest = getMockRequest()

      const result = await EntityApi.getAuth(mockRequest)

      expect(result).toBe('test-token')
    })

    test('should return null when authorization does not exist in cache', async () => {
      const mockRequest = getMockRequest({})

      const result = await EntityApi.getAuth(mockRequest)

      expect(result).toBeNull()
    })
  })

  describe('keyFromLink', () => {
    it('should extract the key from a url', () => {
      const mockRequest = {
        _links: {
          self: {
            href: 'http://localhost:5000/api/submissions/678'
          }
        }
      }
      const result = EntityApi.keyFromLink(mockRequest)

      expect(result).toBe('submissions/678')
    })
  })

  describe('add', () => {
    it('should call Client.request with POST and set id if no errors', async () => {
      const mockRequest = getMockRequest()
      const entityApi = new EntityApi('submissions')
      const mockResponse = {
        _links: { self: { href: 'http://localhost:5000/api/submissions/1' } }
      }
      Client.request.mockResolvedValue(mockResponse)

      const result = await entityApi.add(mockRequest, { name: 'Test' })

      expect(Client.request).toHaveBeenCalledWith(
        'test-token',
        'POST',
        'submissions',
        null,
        { name: 'Test' }
      )
      expect(result.id).toBe('submissions/1')
    })

    it('should return result with errors, if there are any errors', async () => {
      const entityApi = new EntityApi('submissions')
      const mockResponse = { errors: ['Bad Request'] }
      const mockRequest = getMockRequest()
      Client.request.mockResolvedValue(mockResponse)

      const result = await entityApi.add(mockRequest, { invalid: true })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('change', () => {
    it('should call Client.request with PATCH and set id if no errors', async () => {
      const mockRequest = getMockRequest()
      const entityApi = new EntityApi('submissions')
      const mockResponse = {
        _links: { self: { href: 'http://localhost:5000/api/submissions/1' } }
      }
      Client.request.mockResolvedValue(mockResponse)

      const result = await entityApi.change(mockRequest, 'submissions/1', { name: 'Test' })

      expect(Client.request).toHaveBeenCalledWith(
        'test-token',
        'PATCH',
        'submissions/1',
        null,
        { name: 'Test' }
      )
      expect(result.id).toBe('submissions/1')
    })

    it('should return result with errors, if there are any errors', async () => {
      const entityApi = new EntityApi('submissions')
      const mockResponse = { errors: ['Bad Request'] }
      const mockRequest = getMockRequest()
      Client.request.mockResolvedValue(mockResponse)

      const result = await entityApi.change(mockRequest, { invalid: true })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('changeAssoc', () => {
    it('should call Client.requestAssociationChange with token, key and payload', async () => {
      const entityApi = new EntityApi('submissions')
      Client.requestAssociationChange.mockResolvedValue('assoc-ok')
      const result = await entityApi.changeAssoc(getMockRequest(), 'submissions/3', { key: 'val' })

      expect(Client.requestAssociationChange).toHaveBeenCalledWith('test-token', 'submissions/3', { key: 'val' })
      expect(result).toBe('assoc-ok')
    })
  })

  describe('list', () => {
    it('should return mapped list of entities', async () => {
      const entityApi = new EntityApi('submissions')
      const mockResponse = {
        _embedded: {
          submissions: [
            { name: 'A', _links: { self: { href: 'http://localhost/api/submissions/1' } } },
            { name: 'B', _links: { self: { href: 'http://localhost/api/submissions/2' } } }
          ]
        }
      }
      Client.request.mockResolvedValue(mockResponse)

      const result = await entityApi.list(getMockRequest())

      expect(Client.request).toHaveBeenCalledWith('test-token', 'GET', 'submissions')
      expect(result).toEqual([
        { id: 'submissions/1', name: 'A' },
        { id: 'submissions/2', name: 'B' }
      ])
    })
  })

  describe('getFromLink', () => {
    it('should return a mapped list when _embedded is present', async () => {
      const entityApi = new EntityApi('submissions')
      const mockResponse = {
        _embedded: {
          submissions: [
            { name: 'A', _links: { self: { href: 'http://localhost/api/submissions/1' } } }
          ]
        }
      }
      Client.requestFromLink.mockResolvedValue(mockResponse)

      const result = await entityApi.getFromLink(getMockRequest(), 'link')
      expect(Client.requestFromLink).toHaveBeenCalledWith('test-token', 'link')
      expect(result).toEqual([{ id: 'submissions/1', name: 'A' }])
    })

    it('should return single entity with id when _embedded is missing', async () => {
      const entityApi = new EntityApi('submissions')
      const mockResponse = {
        name: 'Solo',
        _links: { self: { href: 'http://localhost/api/submissions/10' } }
      }
      Client.requestFromLink.mockResolvedValue(mockResponse)

      const result = await entityApi.getFromLink(getMockRequest(), 'link')
      expect(result).toEqual({
        name: 'Solo',
        _links: { self: { href: 'http://localhost/api/submissions/10' } },
        id: 'submissions/10'
      })
    })
  })

  describe('getAllChildren', () => {
    it('should aggregate child entities from parentObjects', async () => {
      const entityApi = new EntityApi('submissions')
      const parents = [
        { _links: { child: { href: 'child1' } } },
        { _links: { child: { href: 'child2' } } }
      ]

      jest.spyOn(entityApi, 'getFromLink').mockResolvedValueOnce([{ id: 'c1' }]).mockResolvedValueOnce([{ id: 'c2' }])

      const result = await entityApi.getAllChildren(getMockRequest(), parents, '_links.child.href')
      expect(entityApi.getFromLink).toHaveBeenCalledTimes(2)
      expect(result).toEqual([{ id: 'c1' }, { id: 'c2' }])
    })

    it('should return empty array if no parentObjects', async () => {
      const entityApi = new EntityApi('submissions')
      const result = await entityApi.getAllChildren(getMockRequest(), [], '_links.child.href')
      expect(result).toEqual([])
    })
  })

  describe('getById', () => {
    it('should call Client.request with GET and set id', async () => {
      const entityApi = new EntityApi('submissions')
      const mockResponse = {
        name: 'Submission',
        _links: { self: { href: 'http://localhost/api/submissions/9' } }
      }
      Client.request.mockResolvedValue(mockResponse)

      const result = await entityApi.getById(getMockRequest(), 'submissions/9')

      expect(Client.request).toHaveBeenCalledWith('test-token', 'GET', 'submissions/9', null, null, false)
      expect(result.id).toBe('submissions/9')
    })

    it('should return null if no result', async () => {
      const entityApi = new EntityApi('submissions')
      Client.request.mockResolvedValue(null)
      const result = await entityApi.getById(getMockRequest(), 'missing')
      expect(result).toBeNull()
    })
  })
})
