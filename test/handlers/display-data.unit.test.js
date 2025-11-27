const mockGetFromLink = jest.fn()
const mockGetAllChildrenCatches = jest.fn()
const mockGetAllChildrenSmallCatches = jest.fn()
const mockSortActivities = jest.fn(arr => arr)
const mockSortCatches = jest.fn(arr => arr)
const mockSortSmallCatches = jest.fn(arr => arr)

jest.mock('../../src/api/catches', () => {
  return jest.fn().mockImplementation(() => ({
    getAllChildren: mockGetAllChildrenCatches,
    sort: mockSortCatches
  }))
})

jest.mock('../../src/api/small-catches', () => {
  return jest.fn().mockImplementation(() => ({
    getAllChildren: mockGetAllChildrenSmallCatches,
    sort: mockSortSmallCatches
  }))
})

jest.mock('../../src/api/activities', () => {
  return jest.fn().mockImplementation(() => ({
    getFromLink: mockGetFromLink,
    sort: mockSortActivities
  }))
})

jest.mock('../../src/handlers/common', () => ({
  monthHelper: {
    find: {
      textFromNum: jest.fn(num => `Month${num}`)
    }
  },
  printWeight: jest.fn(() => '10lbs 0oz')
}))

const displayData = require('../../src/handlers/display-data')

describe('display-data.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  const getMockRequest = () => ({})
  const getMockSubmission = () => ({
    _links: {
      activities: { href: 'activities-link' },
      catches: { href: 'catches-link' },
      smallCatches: { href: 'small-catches-link' }
    }
  })
  const getMockActivities = () => ([
    { id: 'a1', _links: { self: { href: 'act1' } }, river: { id: 'r1', name: 'River A' } }
  ])
  const getMockCatches = () => ([{
    id: 'c1',
    dateCaught: '2025-11-20',
    activity: { id: 'a1', river: { id: 'r1' } }
  }])
  const getMockSmallCatches = () => ([{
    id: 's1',
    month: 5,
    activity: { id: 'a1', river: { id: 'r1', name: 'River A' } },
    counts: [{ name: 'Trout', count: 2 }]
  }])

  it('should process activities correctly when CONTEXT=ANGLER', async () => {
    process.env.CONTEXT = 'ANGLER'
    const request = getMockRequest()
    const submission = getMockSubmission()
    mockGetFromLink.mockResolvedValueOnce(getMockActivities())
    mockGetAllChildrenCatches.mockResolvedValueOnce(getMockCatches())
    mockGetAllChildrenSmallCatches.mockResolvedValueOnce(getMockSmallCatches())

    const result = await displayData(request, submission)

    expect(result.activities).toStrictEqual([
      {
        id: 'a1',
        count: 3,
        river: {
          id: 'r1',
          name: 'River A'
        },
        _links: {
          self: {
            href: 'act1'
          }
        }
      }
    ])
  })

  it('should process catches correctly when CONTEXT=ANGLER', async () => {
    process.env.CONTEXT = 'ANGLER'
    const request = getMockRequest()
    const submission = getMockSubmission()
    mockGetFromLink.mockResolvedValueOnce(getMockActivities())
    mockGetAllChildrenCatches.mockResolvedValueOnce(getMockCatches())
    mockGetAllChildrenSmallCatches.mockResolvedValueOnce(getMockSmallCatches())

    const result = await displayData(request, submission)

    expect(result.catches).toStrictEqual([
      {
        activity: {
          id: 'a1',
          river: {
            id: 'r1'
          }
        },
        dateCaught: '20/11',
        hide: false,
        id: 'c1',
        riverHide: false,
        riverRowspan: 1,
        rowspan: 1,
        weight: '10lbs 0oz'
      }
    ])
  })

  it('should process small catches correctly when CONTEXT=ANGLER', async () => {
    process.env.CONTEXT = 'ANGLER'
    const request = getMockRequest()
    const submission = getMockSubmission()
    mockGetFromLink.mockResolvedValueOnce(getMockActivities())
    mockGetAllChildrenCatches.mockResolvedValueOnce(getMockCatches())
    mockGetAllChildrenSmallCatches.mockResolvedValueOnce(getMockSmallCatches())

    const result = await displayData(request, submission)

    expect(result.smallCatches).toStrictEqual([
      {
        activity: {
          id: 'a1',
          river: {
            id: 'r1',
            name: 'River A'
          }
        },
        hide: false,
        id: 's1',
        month: 'Month5',
        river: 'River A',
        rowspan: 1,
        trout: 2
      }
    ])
  })

  it('should process foundInternal when CONTEXT=ANGLER', async () => {
    process.env.CONTEXT = 'ANGLER'
    const request = getMockRequest()
    const submission = getMockSubmission()
    mockGetFromLink.mockResolvedValueOnce(getMockActivities())
    mockGetAllChildrenCatches.mockResolvedValueOnce(getMockCatches())
    mockGetAllChildrenSmallCatches.mockResolvedValueOnce(getMockSmallCatches())

    const result = await displayData(request, submission)

    expect(result.foundInternal).toBe(false)
  })

  it('should set foundInternal=true if internal count exists', async () => {
    process.env.CONTEXT = 'ANGLER'
    const request = getMockRequest()
    const submission = getMockSubmission()
    mockGetFromLink.mockResolvedValueOnce(getMockActivities())
    mockGetAllChildrenCatches.mockResolvedValueOnce(getMockCatches())
    mockGetAllChildrenSmallCatches.mockResolvedValueOnce([{
      id: 's1',
      month: 5,
      activity: { id: 'a1', river: { id: 'r1', name: 'River A' } },
      counts: [{ name: 'Trout', count: 2, internal: true }]
    }])

    const result = await displayData(request, submission)

    expect(result.foundInternal).toBe(true)
  })

  it('should set activity count to 0, if no fish were caught', async () => {
    process.env.CONTEXT = 'ANGLER'
    const request = getMockRequest()
    const submission = getMockSubmission()
    mockGetFromLink.mockResolvedValueOnce(getMockActivities())
    mockGetAllChildrenCatches.mockResolvedValueOnce([])
    mockGetAllChildrenSmallCatches.mockResolvedValueOnce([{
      id: 's1',
      month: 5,
      activity: { id: 'a1', river: { id: 'r1', name: 'River A' } },
      counts: [{ name: 'Trout', count: 0, internal: true }]
    }])

    const result = await displayData(request, submission)

    expect(result.activities).toStrictEqual([
      {
        id: 'a1',
        count: 0,
        river: {
          id: 'r1',
          name: 'River A'
        },
        _links: {
          self: {
            href: 'act1'
          }
        }
      }
    ])
  })

  it('should apply catchIsEqual and riverIsEqual logic when CONTEXT is ADMIN', async () => {
    process.env.CONTEXT = 'ADMIN'
    const request = getMockRequest()
    const submission = getMockSubmission()
    mockGetFromLink.mockResolvedValueOnce(getMockActivities())
    const catches = [{
      id: 'c1',
      dateCaught: '2025-11-20',
      onlyMonthRecorded: true,
      activity: { id: 'a1', river: { id: 'r1' } }
    }, {
      id: 'c2',
      dateCaught: '2025-11-20',
      noDateRecorded: true,
      activity: { id: 'a1', river: { id: 'r1' } }
    }]
    mockGetAllChildrenCatches.mockResolvedValueOnce(catches)
    mockGetAllChildrenSmallCatches.mockResolvedValueOnce([])

    const result = await displayData(request, submission)

    // rowspans should be set
    expect(result.catches).toStrictEqual([
      {
        activity: {
          id: 'a1',
          river: {
            id: 'r1'
          }
        },
        dateCaught: '20/11',
        hide: false,
        id: 'c1',
        onlyMonthRecorded: true,
        riverHide: false,
        riverRowspan: 2,
        rowspan: 2,
        weight: '10lbs 0oz'
      },
      {
        activity: {
          id: 'a1',
          river: {
            id: 'r1'
          }
        },
        dateCaught: '20/11',
        hide: true,
        id: 'c2',
        noDateRecorded: true,
        riverHide: true,
        riverRowspan: 2,
        rowspan: 2,
        weight: '10lbs 0oz'
      }
    ])
  })

  it('should apply smallCatchIsEqual logic when CONTEXT is ADMIN', async () => {
    process.env.CONTEXT = 'ADMIN'
    const request = getMockRequest()
    const submission = getMockSubmission()
    mockGetFromLink.mockResolvedValueOnce(getMockActivities())
    mockGetAllChildrenCatches.mockResolvedValueOnce([])
    const smallCatches = [{
      id: 's1',
      month: 5,
      noMonthRecorded: true,
      activity: { id: 'a1', river: { id: 'r1', name: 'River A' } },
      counts: [{ name: 'Trout', count: 2 }]
    }, {
      id: 's2',
      month: 5,
      noMonthRecorded: true,
      activity: { id: 'a1', river: { id: 'r1', name: 'River A' } },
      counts: [{ name: 'Trout', count: 1 }]
    }]
    mockGetAllChildrenSmallCatches.mockResolvedValueOnce(smallCatches)

    const result = await displayData(request, submission)

    // rowspans should be set
    expect(result.smallCatches).toStrictEqual([
      {
        activity: {
          id: 'a1',
          river: {
            id: 'r1',
            name: 'River A'
          }
        },
        hide: false,
        id: 's1',
        month: 'Month5',
        noMonthRecorded: true,
        river: 'River A',
        rowspan: 2,
        trout: 2
      },
      {
        activity: {
          id: 'a1',
          river: {
            id: 'r1',
            name: 'River A'
          }
        },
        hide: true,
        id: 's2',
        month: 'Month5',
        noMonthRecorded: true,
        river: 'River A',
        rowspan: 2,
        trout: 1
      }
    ])
  })
})
