'use strict'

const Joi = require('@hapi/joi')

// UK postcode regex
const ukPostcodeRegex =
  /^([A-PR-UWYZ]\d{1,2}[A-HJKPSTUW]?|[A-PR-UWYZ][A-HK-Y]\d{1,2}[ABEHMNPRVWXY]?)\s{0,6}(\d[A-Z]{2})$/i

const LICENCE_LENGTH = 6

/**
 * Normalizes and formats a UK postcode
 * @param {string} postcode - Raw postcode string
 * @returns {string} Formatted postcode (e.g. "SW1A 1AA")
 */
const parsePostcode = (postcode) => {
  return postcode.trim().replace(ukPostcodeRegex, '$1 $2').toUpperCase()
}

/**
 * Removes all whitespace and converts to uppercase.
 *
 * @param {string} licence - The licence number
 * @returns {string} The licence number (no spaces, all uppercase).
 */
const parseLicence = (licence) => {
  return licence.replaceAll(/\s+/g, '').toUpperCase()
}

// Joi schema to validate a licence payload
const licenceSchema = Joi.object().keys({
  licence: Joi.string().alphanum().length(LICENCE_LENGTH).required(),
  postcode: Joi.string().required()
})

module.exports = {
  licenceSchema,
  parsePostcode,
  parseLicence
}
