const schema = require('../src/environment-schema')

describe('environment schema validation', () => {
  const getValidEnvVars = (overrides) => ({
    NODE_ENV: 'production',
    CONTEXT: 'ANGLER',
    REDIS_HOSTNAME: 'localhost',
    REDIS_PORT: 6379,
    COOKIE_PW: '12345678901234567890123456789012',
    HTTPS: true,
    SESSION_TTL_MS: 1000,
    AIRBRAKE_HOST: 'https://example.com',
    AIRBRAKE_PROJECT_KEY: 'abc123',
    JS_API_URL: 'https://api.example.com',
    API_REQUEST_TIMEOUT_MS: 5000,
    AUTH_PW: '1234567890123456',
    LRU_ITEMS: 100,
    LRU_TTL: 200,
    GA_TRACKING_ID: 'GA-123',
    REPORTS_S3_LOCATION_BUCKET: 'my-bucket',
    CATCH_RETURNS_GOV_UK: 'https://gov.uk',
    AWS_REGION: 'eu-west-2',
    CLAMD_SOCKET: '/tmp/clam.sock',
    CLAMD_PORT: 3310,
    TEMP_DIR: '/tmp',
    ...overrides
  })

  it('accepts a fully valid environment object', () => {
    const { error } = schema.validate(getValidEnvVars())

    expect(error).toBeUndefined()
  })

  it.each([
    ['NODE_ENV'],
    ['CONTEXT'],
    ['REDIS_HOSTNAME'],
    ['REDIS_PORT'],
    ['COOKIE_PW'],
    ['SESSION_TTL_MS'],
    ['JS_API_URL'],
    ['API_REQUEST_TIMEOUT_MS'],
    ['AUTH_PW'],
    ['CATCH_RETURNS_GOV_UK']
  ])('fails when required field %s is missing', (field) => {
    const env = getValidEnvVars()
    delete env[field]

    const { error } = schema.validate(env)

    expect(error).toBeDefined()
  })

  it('fails when CONTEXT is not ANGLER or FMT', () => {
    const env = getValidEnvVars({ CONTEXT: 'INVALID' })

    const { error } = schema.validate(env)

    expect(error.details[0].message).toBe('"CONTEXT" must be one of [ANGLER, FMT]')
  })

  it('fails when COOKIE_PW is not 32 characters', () => {
    const env = getValidEnvVars({ COOKIE_PW: 'short' })

    const { error } = schema.validate(env)

    expect(error.details[0].message).toBe('"COOKIE_PW" length must be 32 characters long')
  })

  it('fails when AUTH_PW is not 16 characters', () => {
    const env = getValidEnvVars({ AUTH_PW: '123' })

    const { error } = schema.validate(env)

    expect(error.details[0].message).toBe('"AUTH_PW" length must be 16 characters long')
  })

  it('fails when REDIS_PORT is not a valid port', () => {
    const env = getValidEnvVars({ REDIS_PORT: 999999 })

    const { error } = schema.validate(env)

    expect(error.details[0].message).toBe('"REDIS_PORT" must be a valid port')
  })

  it('fails when CLAMD_PORT is invalid', () => {
    const env = getValidEnvVars({ CLAMD_PORT: -1 })

    const { error } = schema.validate(env)

    expect(error.details[0].message).toBe('"CLAMD_PORT" must be a valid port')
  })

  it('fails when CATCH_RETURNS_GOV_UK is not a URI', () => {
    const env = getValidEnvVars({ CATCH_RETURNS_GOV_UK: 'not-a-url' })

    const { error } = schema.validate(env)

    expect(error.details[0].message).toBe('"CATCH_RETURNS_GOV_UK" must be a valid uri')
  })

  it('allows optional fields to be omitted', () => {
    const requiredEnv = {
      NODE_ENV: 'production',
      CONTEXT: 'ANGLER',
      REDIS_HOSTNAME: 'localhost',
      REDIS_PORT: 6379,
      COOKIE_PW: '12345678901234567890123456789012',
      HTTPS: true,
      SESSION_TTL_MS: 1000,
      JS_API_URL: 'https://api.example.com',
      API_REQUEST_TIMEOUT_MS: 5000,
      AUTH_PW: '1234567890123456',
      CATCH_RETURNS_GOV_UK: 'https://gov.uk'
    }

    const { error } = schema.validate(requiredEnv)

    expect(error).toBeUndefined()
  })
})
