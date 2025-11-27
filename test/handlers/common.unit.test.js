const { printWeight, testLocked, monthHelper, isAllowedParam } = require('../../src/handlers/common')

describe('utils.unit', () => {
  describe('printWeight', () => {
    it('should format imperial weight correctly', () => {
      const c = { mass: { type: 'IMPERIAL', oz: 20 } }
      const result = printWeight(c)
      // 20 oz = 1 lb 4 oz
      expect(result).toBe('1lbs 4oz')
    })

    it('should round oz correctly when remainder is rounded to 16', () => {
      const c = { mass: { type: 'IMPERIAL', oz: 15.9 } }
      const result = printWeight(c)
      // 15.9 oz is rounded to 1lbs 0oz
      expect(result).toBe('1lbs 0oz')
    })

    it('should format metric weight correctly', () => {
      const c = { mass: { type: 'METRIC', kg: 12.3456 } }
      const result = printWeight(c)
      expect(result).toBe('12.346kg')
    })
  })

  describe('testLocked', () => {
    const dropMock = jest.fn().mockResolvedValue()
    const setCacheMock = jest.fn().mockResolvedValue()

    const getMockRequest = (overrides = {}) => ({
      cache: jest.fn(() => ({
        drop: dropMock,
        set: setCacheMock
      })),
      cookieAuth: { clear: jest.fn() },
      ...overrides
    })

    it('should drop cache if submission is null', async () => {
      const request = getMockRequest()

      await testLocked(request, {}, null)

      expect(dropMock).toHaveBeenCalled()
    })

    it('should clear cookieAuth if submission is null', async () => {
      const request = getMockRequest()

      await testLocked(request, {}, null)

      expect(request.cookieAuth.clear).toHaveBeenCalled()
    })

    it('should return false if submission is null', async () => {
      const request = getMockRequest()

      const result = await testLocked(request, {}, null)

      expect(result).toBe(false)
    })

    it('should set cache if submission status is SUBMITTED', async () => {
      const cache = {}
      const request = getMockRequest()
      const submission = { status: 'SUBMITTED', id: '123' }

      await testLocked(request, cache, submission)

      expect(setCacheMock).toHaveBeenCalledWith(cache)
    })

    it('should  return true if submission status is SUBMITTED', async () => {
      const request = getMockRequest()
      const submission = { status: 'SUBMITTED', id: '123' }

      const result = await testLocked(request, {}, submission)

      expect(result).toBe(true)
    })

    it('should return false if submission status is not SUBMITTED', async () => {
      const request = getMockRequest()

      const submission = { status: 'DRAFT', id: '123' }

      const result = await testLocked(request, {}, submission)
      expect(result).toBe(false)
    })
  })

  describe('monthHelper.find', () => {
    it('should return num from key', () => {
      const result = monthHelper.find.numFromKey('JANUARY')
      expect(result).toBe(1)
    })

    it('should return null if key not found', () => {
      const result = monthHelper.find.numFromKey('NOTAMONTH')
      expect(result).toBeNull()
    })

    it('should return key from num', () => {
      const result = monthHelper.find.keyFromNum(1)
      expect(result).toBe('JANUARY')
    })

    it('should return null if num not found', () => {
      const result = monthHelper.find.keyFromNum(99)
      expect(result).toBeNull()
    })

    it('should return text from num', () => {
      const result = monthHelper.find.textFromNum(1)
      expect(result).toBe('January')
    })

    it('should return null if num not found', () => {
      const result = monthHelper.find.textFromNum(99)
      expect(result).toBeNull()
    })
  })

  describe('isAllowedParam', () => {
    it('should return true for numeric param', () => {
      expect(isAllowedParam('123')).toBe(true)
    })

    it('should return true for "add"', () => {
      expect(isAllowedParam('add')).toBe(true)
    })

    it('should return false for non-numeric and not "add"', () => {
      expect(isAllowedParam('abc')).toBe(false)
    })
  })
})
