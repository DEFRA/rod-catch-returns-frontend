const { calculateTokenTtl } = require('../../src/lib/date-utils')

describe('calculateTokenTtl', () => {
  it('should return a TTL for a date string', () => {
    const futureDate = new Date(Date.now() + 60000).toISOString() // 60s from now

    const ttl = calculateTokenTtl(futureDate)

    expect(ttl).toBeGreaterThan(59000)
    expect(ttl).toBeLessThanOrEqual(60000)
  })

  it('should return a positive TTL for a future Date object', () => {
    const futureDate = new Date(Date.now() + 30000) // 30s from now

    const ttl = calculateTokenTtl(futureDate)

    expect(ttl).toBeGreaterThan(29000)
    expect(ttl).toBeLessThanOrEqual(30000)
  })

  it('should return a positive TTL for a future timestamp', () => {
    const futureTimestamp = Date.now() + 15000 // 15s from now

    const ttl = calculateTokenTtl(futureTimestamp)

    expect(ttl).toBeGreaterThan(14000)
    expect(ttl).toBeLessThanOrEqual(15000)
  })

  it.each(['invalid-date', undefined])('should throw an error if %s is passed in', (input) => {
    expect(() => calculateTokenTtl(input)).toThrow('Invalid expiration time provided')
  })
})
