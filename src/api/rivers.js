'use strict'

const EntityApi = require('./cached-entity-api')

/**
 * Rivers entity handler
 *
 */
module.exports = class RiversApi extends EntityApi {
  constructor () {
    super('rivers', async (request, e) => {
      return {
        id: EntityApi.keyFromLink(e),
        name: e.name,
        internal: e.internal
      }
    })
  }

  // Sort by name
  sort (a, b) {
    if (a.name < b.name) {
      return -1
    }

    if (a.name > b.name) {
      return 1
    }

    return 0
  }
}
