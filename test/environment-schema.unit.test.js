const schema = require('../src/environment-schema')

describe('environment schema validation', () => {
  const validEnv = {
    NODE_ENV: 'production',
    CONTEXT: 'ANGLER',
    REDIS_HOSTNAME: 'localhost',
    REDIS_PORT: 6379,
    COOKIE_PW: '12345678901234567890123456789012', // 32 chars
    HTTPS: true,
    SESSION_TTL_MS: 1000,
    AIRBRAKE_HOST: 'https://example.com',
    AIRBRAKE_PROJECT_KEY: 'abc123',
    JS_API_URL: 'https://api.example.com',
    API_REQUEST_TIMEOUT_MS: 5000,
    AUTH_PW: '1234567890123456', // 16 chars
    LRU_ITEMS: 100,
    LRU_TTL: 200,
    GA_TRACKING_ID: 'GA-123',
    REPORTS_S3_LOCATION_BUCKET: 'my-bucket',
    CATCH_RETURNS_GOV_UK: 'https://gov.uk',
    AWS_REGION: 'eu-west-2',
    CLAMD_SOCKET: '/tmp/clam.sock',
    CLAMD_PORT: 3310,
    TEMP_DIR: '/tmp'
  }

  it('accepts a fully valid environment object', () => {
    const { error } = schema.validate(validEnv)
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
    const env = { ...validEnv }
    delete env[field]

    const { error } = schema.validate(env)
    expect(error).toBeDefined()
  })

  it('fails when CONTEXT is not ANGLER or FMT', () => {
    const env = { ...validEnv, CONTEXT: 'INVALID' }
    const { error } = schema.validate(env)
    expect(error).toBeDefined()
  })

  it('fails when COOKIE_PW is not 32 characters', () => {
    const env = { ...validEnv, COOKIE_PW: 'short' }
    const { error } = schema.validate(env)
    expect(error).toBeDefined()
  })

  it('fails when AUTH_PW is not 16 characters', () => {
    const env = { ...validEnv, AUTH_PW: '123' }
    const { error } = schema.validate(env)
    expect(error).toBeDefined()
  })

  it('fails when REDIS_PORT is not a valid port', () => {
    const env = { ...validEnv, REDIS_PORT: 999999 }
    const { error } = schema.validate(env)
    expect(error).toBeDefined()
  })

  it('fails when CLAMD_PORT is invalid', () => {
    const env = { ...validEnv, CLAMD_PORT: -1 }
    const { error } = schema.validate(env)
    expect(error).toBeDefined()
  })

  it('fails when CATCH_RETURNS_GOV_UK is not a URI', () => {
    const env = { ...validEnv, CATCH_RETURNS_GOV_UK: 'not-a-url' }
    const { error } = schema.validate(env)
    expect(error).toBeDefined()
  })

  it('allows optional fields to be omitted', () => {
    const optionalEnv = { ...validEnv }
    delete optionalEnv.AIRBRAKE_HOST
    delete optionalEnv.AIRBRAKE_PROJECT_KEY
    delete optionalEnv.LRU_ITEMS
    delete optionalEnv.LRU_TTL
    delete optionalEnv.GA_TRACKING_ID
    delete optionalEnv.REPORTS_S3_LOCATION_BUCKET
    delete optionalEnv.AWS_REGION
    delete optionalEnv.CLAMD_SOCKET
    delete optionalEnv.CLAMD_PORT
    delete optionalEnv.TEMP_DIR

    const { error } = schema.validate(optionalEnv)
    expect(error).toBeUndefined()
  })
})
