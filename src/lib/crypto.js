'use strict'

/**
 * Used to encrypt and decrypt the authorization details in the redis cache.
 * Uses AES-256 https://en.wikipedia.org/wiki/Advanced_Encryption_Standard
 *
 */
const crypto = require('crypto')
const algorithm = 'aes128'
const keyBuffer = Buffer.from(process.env.AUTH_PW)

class CryptoError extends Error {
  constructor (message) {
    super(message)
    this.name = 'Crypto error'
  }
}

const internals = {
  encrypt: async (cache, text) => {
    try {
      const hubId = await cache.get('hub-identity')
      if (!hubId) {
        throw new CryptoError('Expected hub identifier')
      }
      console.log('KEY=')
      console.log(keyBuffer);
      const cipher = crypto.createCipheriv(algorithm, keyBuffer, Buffer.from(hubId.data))
      let result = cipher.update(text, 'utf8', 'base64')
      result += cipher.final('base64')
      return result
    } catch (err) {
      throw new CryptoError('Encryption error' + err)
    }
  },

  decrypt: async (cache, text) => {
    try {
      const hubId = await cache.get('hub-identity')
      if (!hubId) {
        throw new CryptoError('Expected hub identifier')
      }
      const decipher = crypto.createDecipheriv(algorithm, keyBuffer, Buffer.from(hubId.data))
      let result = decipher.update(text, 'base64')
      result += decipher.final()
      return result
    } catch (err) {
      throw new CryptoError('Decryption error')
    }
  }
}

module.exports = {
  writeObj: async (cache, obj) => {
    return internals.encrypt(cache, JSON.stringify(obj))
  },

  readObj: async (cache, str) => {
    try {
      return JSON.parse(await internals.decrypt(cache, str))
    } catch (err) {
      throw new CryptoError('Deserialization error')
    }
  },

  cryptoError: CryptoError
}
