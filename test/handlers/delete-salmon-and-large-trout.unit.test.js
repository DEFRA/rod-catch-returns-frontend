const mockGetByIdCatch = jest.fn()
const mockDoMap = jest.fn()
const mockDeleteById = jest.fn()
const mockGetByIdSubmission = jest.fn()
const mockGetFromLink = jest.fn()
const mockIsAllowedParam = jest.fn()
const mockTestLocked = jest.fn()

const DeleteSalmonAndLargeTroutHandler = require('../../src/handlers/delete-salmon-and-large-trout')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/catches', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetByIdCatch,
    doMap: mockDoMap,
    deleteById: mockDeleteById
  }))
})

jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetByIdSubmission
  }))
})

jest.mock('../../src/api/activities', () => {
  return jest.fn().mockImplementation(() => ({
    getFromLink: mockGetFromLink
  }))
})

jest.mock('../../src/handlers/common', () => ({
  printWeight: jest.fn(() => '10lbs 0oz'),
  testLocked: mockTestLocked,
  isAllowedParam: mockIsAllowedParam
}))

describe('delete-river-handler.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getMockRequest = (overrides) => ({
    params: { id: '123' },
    path: '/delete-river',
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValueOnce({
        submissionId: 'sub1',
        licenceNumber: 'LN123',
        postcode: 'AB12CD',
        year: '2025'
      }),
      set: jest.fn().mockResolvedValueOnce()
    })),
    ...overrides
  })

  describe('doGet', () => {
    it('should throw ResponseError if id param is not allowed', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(false)
      const handler = new DeleteSalmonAndLargeTroutHandler('delete-river')

      await expect(handler.doGet(request, h)).rejects.toThrow('Unknown activity')
    })

    it('should throw ResponseError if largeCatch is not found', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetByIdCatch.mockResolvedValueOnce(null)
      const handler = new DeleteSalmonAndLargeTroutHandler('delete-river')

      await expect(handler.doGet(request, h)).rejects.toThrow('Unauthorized access to large catch')
    })

    it('should throw ResponseError if activityEntity not in activities', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetByIdCatch.mockResolvedValueOnce({ _links: { activityEntity: { href: 'bad-link' } }, id: 'c1' })
      mockGetByIdSubmission.mockResolvedValueOnce({ _links: { activities: { href: 'activities-link' } } })
      mockGetFromLink.mockResolvedValueOnce([{ _links: { self: { href: 'other-link' } } }])
      const handler = new DeleteSalmonAndLargeTroutHandler('delete-river')

      await expect(handler.doGet(request, h)).rejects.toThrow('Unauthorized access to large catch')
    })

    it('should redirect to review if testLocked returns true', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      mockGetByIdCatch.mockResolvedValueOnce({ _links: { activityEntity: { href: 'good-link' } }, id: 'c1' })
      mockGetByIdSubmission.mockResolvedValueOnce({ _links: { activities: { href: 'activities-link' } } })
      mockGetFromLink.mockResolvedValueOnce([{ _links: { self: { href: 'good-link' } } }])
      mockTestLocked.mockResolvedValueOnce(true)
      const handler = new DeleteSalmonAndLargeTroutHandler('delete-river')

      const result = await handler.doGet(request, h)
      expect(result).toEqual(h.redirect('/review'))
    })

    it('should render view with mapped catch when all checks pass', async () => {
      const request = getMockRequest()
      const h = getMockH()
      mockIsAllowedParam.mockReturnValueOnce(true)
      const largeCatch = { _links: { activityEntity: { href: 'good-link' } }, id: 'c1' }
      mockGetByIdCatch.mockResolvedValueOnce(largeCatch)
      mockGetByIdSubmission.mockResolvedValueOnce({ _links: { activities: { href: 'activities-link' } } })
      mockGetFromLink.mockResolvedValueOnce([{ _links: { self: { href: 'good-link' } } }])
      mockTestLocked.mockResolvedValueOnce(false)
      mockDoMap.mockResolvedValueOnce({ dateCaught: '2025-11-20', mass: { type: 'IMPERIAL', oz: 160 } })
      const handler = new DeleteSalmonAndLargeTroutHandler('delete-river')

      await handler.doGet(request, h)

      expect(mockDoMap).toHaveBeenCalledWith(request, largeCatch)
      expect(h.view).toHaveBeenCalledWith(
        'delete-river',
        {
          largeCatch: {
            dateCaught: '20/11',
            weight: '10lbs 0oz',
            mass: {
              oz: 160,
              type: 'IMPERIAL'
            }
          },
          details: {
            licenceNumber: 'LN123',
            postcode: 'AB12CD',
            year: '2025'
          }
        }
      )
    })
  })

  describe('doPost', () => {
    it('should delete catch by id', async () => {
      const request = getMockRequest()
      const h = getMockH()
      const cacheObj = { delete: 'c1' }
      request.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValueOnce(cacheObj),
        set: jest.fn().mockResolvedValueOnce()
      }))
      const handler = new DeleteSalmonAndLargeTroutHandler('delete-river')

      await handler.doPost(request, h)

      expect(mockDeleteById).toHaveBeenCalledWith(request, 'c1')
    })

    it('should redirect to summary', async () => {
      const request = getMockRequest()
      const h = getMockH()
      const handler = new DeleteSalmonAndLargeTroutHandler('delete-river')
      const cacheObj = { delete: 'c1' }
      request.cache = jest.fn(() => ({
        get: jest.fn().mockResolvedValueOnce(cacheObj),
        set: jest.fn().mockResolvedValueOnce()
      }))

      await handler.doPost(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/summary')
    })
  })
})
