'use strict'

/**
 * Environment Joi validation schema
 */
const Joi = require('@hapi/joi')

module.exports = Joi.object().keys({
  NODE_ENV: Joi.string().required(),
  CONTEXT: Joi.string().valid('ANGLER', 'FMT').required(),
  REDIS_HOSTNAME: Joi.string().required(),
  REDIS_PORT: Joi.number().port().required(),
  COOKIE_PW: Joi.string().length(32).required(),
  HTTPS: Joi.boolean(),
  SESSION_TTL_MS: Joi.number().required(),
  AIRBRAKE_HOST: Joi.string().uri(),
  AIRBRAKE_PROJECT_KEY: Joi.string(),
  JS_API_URL: Joi.string().required(),
  API_HOSTNAME: Joi.string().required(),
  API_PORT: Joi.number().port().required(),
  API_PATH: Joi.string().required(),
  API_REQUEST_TIMEOUT_MS: Joi.number().required(),
  AUTH_PW: Joi.string().length(16).required(),
  LRU_ITEMS: Joi.number(),
  LRU_TTL: Joi.number(),
  GA_TRACKING_ID: Joi.string(),
  REPORTS_S3_LOCATION_BUCKET: Joi.string(),
  CATCH_RETURNS_GOV_UK: Joi.string().uri().required(),
  AWS_REGION: Joi.string(),
  CLAMD_SOCKET: Joi.string(),
  CLAMD_PORT: Joi.number().port(),
  TEMP_DIR: Joi.string()
})
