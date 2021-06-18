const crypto = require('crypto')

const { sessionIdProducer, isStaticResource } = require('../../src/lib/analytics')

describe('analytics', () => {
  describe('isStaticResource', () => {
    it('returns false for path which are not a static resource', () => {
      expect(isStaticResource({ path: '/foo' })).toBeFalsy()
    })

    it.each(['/public/this/path/doesnt/work', '/public/nor/does/this/one', '/public/this/one/too', '/robots.txt'])(
      'returns true for paths which are static resources (%s)',
      path => {
        expect(isStaticResource({ path })).toBeTruthy()
      }
    )
  })

  describe('sessionIdProducer', () => {
    it('should return null if accessing a static resource', () => {
      const request = {
        path: '/robots.txt'
      }
      const result = sessionIdProducer(request)
      expect(result).toBeNull()
    })

    it('should return a hash of the ip and user-agent using sha256', () => {
      const hashMock = jest.spyOn(crypto, 'createHash')
      const request = {
        path: '/',
        info: {
          remoteAddress: '127.0.0.1'
        },
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36'
        }
      }

      const result = sessionIdProducer(request)

      expect(result).not.toBeNull()
      expect(hashMock).toBeCalledWith('sha256')
    })

    it('should return the same hash if the function is called twice', () => {
      const request = {
        path: '/',
        info: {
          remoteAddress: '127.0.0.1'
        },
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36'
        }
      }

      const result1 = sessionIdProducer(request)
      const result2 = sessionIdProducer(request)

      expect(result1).toBe(result2)
    })
  })
})
