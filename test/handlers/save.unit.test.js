const SaveHandler = require('../../src/handlers/save')
const { getMockH } = require('../test-utils/server-test-utils')
const moment = require('moment')

describe('save-handler.unit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  const getMockRequest = (cacheObj = { year: moment().year().toString() }) => ({
    cache: jest.fn(() => ({
      get: jest.fn().mockResolvedValue(cacheObj),
      drop: jest.fn().mockResolvedValue(),
      set: jest.fn().mockResolvedValue()
    })),
    cookieAuth: { clear: jest.fn() }
  })

  it('should render view with extendPeriod=false when year is current year', async () => {
    const year = moment().year().toString()
    const request = getMockRequest({ year })
    const h = getMockH()
    const handler = new SaveHandler('save')

    await handler.doGet(request, h)

    expect(h.view).toHaveBeenCalledWith('save', {
      extendPeriod: false,
      catchReturnsRef: 'https://www.gov.uk/catch-returns',
      catchReturnsLink: 'www.gov.uk/catch-returns',
      year,
      fmt: false
    })
  })

  it('should render view with extendPeriod=true when year is previous year', async () => {
    const previousYear = (moment().year() - 1).toString()
    const request = getMockRequest({ year: previousYear })
    const h = getMockH()
    const handler = new SaveHandler('save')

    await handler.doGet(request, h)

    expect(h.view).toHaveBeenCalledWith('save', expect.objectContaining({
      extendPeriod: true,
      year: previousYear
    }))
  })

  it('should drop cache and clear cookieAuth when CONTEXT=ANGLER', async () => {
    process.env.CONTEXT = 'ANGLER'
    const h = getMockH()
    const mockCacheDrop = jest.fn(() => ({}))
    const request = {
      cache: () => ({
        get: jest.fn().mockResolvedValue({ year: moment().year().toString() }),
        drop: mockCacheDrop,
        set: jest.fn().mockResolvedValue()
      }),
      cookieAuth: { clear: jest.fn() }
    }
    const handler = new SaveHandler('save')

    await handler.doGet(request, h)

    expect(mockCacheDrop).toHaveBeenCalled()
    expect(request.cookieAuth.clear).toHaveBeenCalled()
  })

  it('should set fmt=true when CONTEXT=FMT', async () => {
    process.env.CONTEXT = 'FMT'
    const request = getMockRequest()
    const h = getMockH()
    const handler = new SaveHandler('save')

    await handler.doGet(request, h)

    expect(h.view).toHaveBeenCalledWith('save', expect.objectContaining({
      fmt: true
    }))
  })
})
