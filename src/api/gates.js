'use strict'

const EntityApi = require('./cached-entity-api')

/**
 * Methods entity handler
 *
 */
module.exports = class GatesApi extends EntityApi {
  constructor () {
    super('grilseWeightGates', async (request, e) => {
      return {
        id: EntityApi.keyFromLink(e).replace('grilseWeightGates/', ''),
        name: e.name
      }
    })
  }
}
