'use strict'

const EntityApi = require('./entity-api')
const RiversApi = require('../api/rivers')

const riversApi = new RiversApi()

/**
 * Activities entity handler
 *
 */
module.exports = class ActivitiesApi extends EntityApi {
  constructor () {
    super('activities', async (request, a) => {
      const river = await riversApi.getFromLink(request, a._links.river.href)
      return {
        id: EntityApi.keyFromLink(a),
        daysFishedOther: a.daysFishedOther,
        daysFishedWithMandatoryRelease: a.daysFishedWithMandatoryRelease,
        river: {
          id: EntityApi.keyFromLink(river),
          name: river.name,
          internal: river.internal
        },
        _links: a._links
      }
    })
  }

  async add (request, submissionId, river, daysFishedWithMandatoryRelease, daysFishedOther) {
    return super.add(request, {
      submission: submissionId,
      river: river,
      daysFishedWithMandatoryRelease: daysFishedWithMandatoryRelease,
      daysFishedOther: daysFishedOther
    })
  }

  async change (request, activityId, submissionId, riverId, daysFishedWithMandatoryRelease, daysFishedOther) {
    // Change the days
    const result = await super.change(request, activityId, {
      daysFishedWithMandatoryRelease: daysFishedWithMandatoryRelease,
      daysFishedOther: daysFishedOther,
      river: riverId
    })

    return result
  }

  sort (a, b) {
    if (a.river.name > b.river.name) {
      return 1
    }

    if (a.river.name < b.river.name) {
      return -1
    }

    return 0
  }
}
