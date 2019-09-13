'use strict'
const EntityApi = require('./entity-api')
const Client = require('./client')

/**
 * This extends the EntityAPI by caching the result of the list request for one hour
 * It should only be used for reference data
 * @type {module.CachedEntityApi}
 */
module.exports = class CachedEntityApi extends EntityApi {
  constructor (...args) {
    super(...args)
    this._cache = null
    this._cacheTtlMilliseconds = 1000 * 60 * 60
  }

  // List all entities - used for reference data. This returns data from the a cache
  async list (request) {
    if (!this._cache) {
      const result = await Client.request(await EntityApi.getAuth(request), Client.method.GET, this.path)
      this._cache = await Promise.all(result._embedded[this.path].map(m => this.mapper(request, m)))
      // Delete the cache object after a given interval (defaulted at one hour)
      setTimeout(() => { this._cache = null }, this._cacheTtlMilliseconds)
    }
    return this._cache
  }
}
