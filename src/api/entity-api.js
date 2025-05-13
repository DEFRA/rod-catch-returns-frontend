'use strict'

/**
 * Root functions for a given entity. A mapper function may be provided which operates on
 * results which return a set of items.
 * @param entity
 * @return {Promise.<*>}
 */

const Client = require('./client')
const Crypto = require('../lib/crypto')
const { URL } = require('url')
const dotProp = require('dot-prop')

module.exports = class EntityApi {
  constructor (path, mapper = async (request, e) => {
    return {
      id: EntityApi.keyFromLink(e),
      name: e.name
    }
  }) {
    this.path = path
    this.mapper = mapper
  }

  static async getAuth (request) {
    const cache = await request.cache().get()
    return cache.authorization ? Crypto.readObj(request.server.app.cache, cache.authorization).token : null
  }

  // Calculate the object key from the link. Used in payloads
  static keyFromLink (obj) {
    const url = new URL(obj._links.self.href)
    return url.pathname.replace(process.env.API_PATH + '/', '')
  }

  /*
   * Add (POST) a new entity
   * The result may be the stored entity or the error array
   */
  async add (request, payload) {
    const result = await Client.request(await EntityApi.getAuth(request), Client.method.POST, this.path, null, payload)
    if (!Object.keys(result).includes('errors')) {
      result.id = EntityApi.keyFromLink(result)
    }
    return result
  }

  /*
   * Change (PATCH) an entity. The key encodes the entity path
   * The result may be the stored entity or the error array
   */
  async change (request, key, payload) {
    const result = await Client.request(await EntityApi.getAuth(request), Client.method.PATCH, key, null, payload)
    if (!Object.keys(result).includes('errors')) {
      result.id = EntityApi.keyFromLink(result)
    }
    return result
  }

  // Spring data rest requires a specific operation to change relationships
  async changeAssoc (request, key, payload) {
    return Client.requestAssociationChange(await EntityApi.getAuth(request), key, payload)
  }

  // List all entities - used for reference data
  async list (request) {
    const result = await Client.request(await EntityApi.getAuth(request), Client.method.GET, this.path)
    return Promise.all(result._embedded[this.path].map(m => this.mapper(request, m)))
  }

  /*
   * Get either a list of entities or a single entity from an href.
   * if a single entity add tke key, otherwise execute the list mapper
   */
  async getFromLink (request, link) {
    const result = await Client.requestFromLink(await EntityApi.getAuth(request), link)
    if (result._embedded) {
      return Promise.all(result._embedded[this.path].map(m => this.mapper(request, m)))
    } else {
      result.id = EntityApi.keyFromLink(result)
      return result
    }
  }

  /*
   * Get a concatenated list of entities which are the children of all parentObjects. The data for the entities is retrieved by processing the href
   * that must be present at jsonHrefPath on each parentObject
   */
  async getAllChildren (request, parentObjects, jsonHrefPath) {
    let results = []
    if (parentObjects && parentObjects.length) {
      const uris = parentObjects.map(p => dotProp.get(p, jsonHrefPath))
      const jobs = uris.map(uri => this.getFromLink(request, uri))
      results = await Promise.all(jobs)
    }
    return [].concat.apply([], results)
  }

  // Get a single entity by its id.
  async getById (request, id) {
    const result = await Client.request(await EntityApi.getAuth(request), Client.method.GET, id, null, null, false)
    if (result) {
      result.id = EntityApi.keyFromLink(result)
    }
    return result
  }

  // Delete a single entity by its id. Throws on a 404
  async deleteById (request, id) {
    await Client.request(await EntityApi.getAuth(request), Client.method.DELETE, id, null, null, true)
  }

  // Execute the (profile) search function
  async searchFunction (request, searchFunction, query) {
    const result = await Client.request(await EntityApi.getAuth(request), Client.method.GET, this.path + `/search/${searchFunction}`, query)

    if (!result) {
      return null
    }

    if (result._embedded) {
      return Promise.all(result._embedded[this.path].map(m => this.mapper(request, m)))
    } else {
      result.id = EntityApi.keyFromLink(result)
      return result
    }
  }

  // Apply the mapper to the result
  async doMap (request, o) {
    return this.mapper(request, o)
  }
}
