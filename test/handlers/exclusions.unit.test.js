const mockGetByIdSubmission = jest.fn()
const mockGetFromLink = jest.fn()
const mockGetAllChildrenCatches = jest.fn()
const mockGetAllChildrenSmallCatches = jest.fn()
const mockChangeSubmissionExclusion = jest.fn()
const mockChangeLargeCatchExclusion = jest.fn()
const mockChangeSmallCatchExclusion = jest.fn()

const ExclusionsHandler = require('../../src/handlers/exclusions')
const { getMockH } = require('../test-utils/server-test-utils')

jest.mock('../../src/api/submissions', () => {
  return jest.fn().mockImplementation(() => ({
    getById: mockGetByIdSubmission,
    changeExclusion: mockChangeSubmissionExclusion
  }))
})

jest.mock('../../src/api/activities', () => {
  return jest.fn().mockImplementation(() => ({
    getFromLink: mockGetFromLink
  }))
})

jest.mock('../../src/api/catches', () => {
  return jest.fn().mockImplementation(() => ({
    getAllChildren: mockGetAllChildrenCatches,
    changeExclusion: mockChangeLargeCatchExclusion
  }))
})

jest.mock('../../src/api/small-catches', () => {
  return jest.fn().mockImplementation(() => ({
    getAllChildren: mockGetAllChildrenSmallCatches,
    changeExclusion: mockChangeSmallCatchExclusion
  }))
})

describe('exclusions-handler.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getMockRequest = (payload = {}) => ({
    payload,
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ submissionId: 'submissions/1' }),
      set: jest.fn().mockResolvedValue()
    }))
  })

  const getMockSubmission = (overrides = {}) => ({
    id: 'submissions/1',
    reportingExclude: false,
    _links: { activities: { href: 'http://localhost:5000/api/activities/3' } },
    ...overrides
  })

  const getMockActivities = () => ([{ id: 'activities/3' }])

  describe('doPost', () => {
    it('should change submission exclusion when payloadKey is exclude-1 and setting differs', async () => {
      const submission = getMockSubmission({ reportingExclude: false })
      mockGetByIdSubmission.mockResolvedValue(submission)
      mockGetFromLink.mockResolvedValue(getMockActivities())
      mockGetAllChildrenCatches.mockResolvedValue([])
      mockGetAllChildrenSmallCatches.mockResolvedValue([])
      const request = getMockRequest({ 'exclude-1': 'true' })
      const handler = new ExclusionsHandler('exclusions')

      await handler.doPost(request, getMockH())

      expect(mockChangeSubmissionExclusion).toHaveBeenCalledWith(request, 'submissions/1', true)
    })

    it('should not call changeExclusion on submission when payloadKey is exclude-1 and setting is same', async () => {
      const submission = getMockSubmission({ reportingExclude: true })
      mockGetByIdSubmission.mockResolvedValue(submission)
      mockGetFromLink.mockResolvedValue(getMockActivities())
      mockGetAllChildrenCatches.mockResolvedValue([])
      mockGetAllChildrenSmallCatches.mockResolvedValue([])
      const request = getMockRequest({ 'exclude-1': 'true' })
      const handler = new ExclusionsHandler('exclusions')

      await handler.doPost(request, getMockH())

      expect(mockChangeSubmissionExclusion).not.toHaveBeenCalled()
    })

    it('should change small catch exclusion when payloadKey includes smallCatches and is different', async () => {
      const submission = getMockSubmission()
      mockGetByIdSubmission.mockResolvedValue(submission)
      mockGetFromLink.mockResolvedValue(getMockActivities())
      const smallCatch = { id: 'smallCatches/1', reportingExclude: false }
      mockGetAllChildrenCatches.mockResolvedValue([])
      mockGetAllChildrenSmallCatches.mockResolvedValue([smallCatch])
      const request = getMockRequest({ 'exclude-smallCatches/1': 'true' })
      const handler = new ExclusionsHandler('exclusions')

      await handler.doPost(request, getMockH())

      expect(mockChangeSmallCatchExclusion).toHaveBeenCalledWith(request, 'smallCatches/1', true)
    })

    it('should not call smallCatches.changeExclusion if small catch not found', async () => {
      const submission = getMockSubmission()
      mockGetByIdSubmission.mockResolvedValue(submission)
      mockGetFromLink.mockResolvedValue(getMockActivities())
      mockGetAllChildrenCatches.mockResolvedValue([])
      mockGetAllChildrenSmallCatches.mockResolvedValue([])
      const request = getMockRequest({ 'smallCatches/1': 'true' })
      const handler = new ExclusionsHandler('exclusions')

      await handler.doPost(request, getMockH())

      expect(mockChangeSmallCatchExclusion).not.toHaveBeenCalled()
    })

    it('should not call smallCatches.changeExclusion if setting is same', async () => {
      const submission = getMockSubmission()
      mockGetByIdSubmission.mockResolvedValue(submission)
      mockGetFromLink.mockResolvedValue(getMockActivities())
      const smallCatch = { id: 'smallCatches/1', reportingExclude: true }
      mockGetAllChildrenCatches.mockResolvedValue([])
      mockGetAllChildrenSmallCatches.mockResolvedValue([smallCatch])

      const request = getMockRequest({ 'exclude-smallCatches/1': 'true' })
      const handler = new ExclusionsHandler('exclusions')

      await handler.doPost(request, getMockH())

      expect(mockChangeSmallCatchExclusion).not.toHaveBeenCalled()
    })

    it('should change large catch exclusion when payloadKey includes catches and is different', async () => {
      const submission = getMockSubmission()
      mockGetByIdSubmission.mockResolvedValue(submission)
      mockGetFromLink.mockResolvedValue(getMockActivities())
      const largeCatch = { id: 'catches/1', reportingExclude: false }
      mockGetAllChildrenCatches.mockResolvedValue([largeCatch])
      mockGetAllChildrenSmallCatches.mockResolvedValue([])
      const request = getMockRequest({ 'exclude-catches/1': 'true' })
      const handler = new ExclusionsHandler('exclusions')

      await handler.doPost(request, getMockH())

      expect(mockChangeLargeCatchExclusion).toHaveBeenCalledWith(request, 'catches/1', true)
      expect(largeCatch.reportingExclude).toBe(true)
    })

    it('should not call catches.changeExclusion if large catch not found', async () => {
      const submission = getMockSubmission()
      mockGetByIdSubmission.mockResolvedValue(submission)
      mockGetFromLink.mockResolvedValue(getMockActivities())
      mockGetAllChildrenCatches.mockResolvedValue([])
      mockGetAllChildrenSmallCatches.mockResolvedValue([])
      const request = getMockRequest({ 'exclude-catches/1': 'true' })
      const handler = new ExclusionsHandler('exclusions')

      await handler.doPost(request, getMockH())

      expect(mockChangeLargeCatchExclusion).not.toHaveBeenCalled()
    })

    it('should not call catches.changeExclusion if setting is same', async () => {
      const submission = getMockSubmission()
      mockGetByIdSubmission.mockResolvedValue(submission)
      mockGetFromLink.mockResolvedValue(getMockActivities())
      const largeCatch = { id: 'catches/1', reportingExclude: true }
      mockGetAllChildrenCatches.mockResolvedValue([largeCatch])
      mockGetAllChildrenSmallCatches.mockResolvedValue([])
      const request = getMockRequest({ 'exclude-catches/1': 'true' })
      const handler = new ExclusionsHandler('exclusions')

      await handler.doPost(request, getMockH())

      expect(mockChangeLargeCatchExclusion).not.toHaveBeenCalled()
    })

    it('should return an empty response object in all cases', async () => {
      const submission = getMockSubmission()
      mockGetByIdSubmission.mockResolvedValue(submission)
      mockGetFromLink.mockResolvedValue(getMockActivities())
      mockGetAllChildrenCatches.mockResolvedValue([])
      mockGetAllChildrenSmallCatches.mockResolvedValue([])
      const request = getMockRequest({ 'exclude-1': 'false' })
      const handler = new ExclusionsHandler('exclusions')

      const result = await handler.doPost(request, getMockH())
      expect(result).toEqual({})
    })
  })
})
