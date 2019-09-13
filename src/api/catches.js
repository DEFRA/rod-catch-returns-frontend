'use strict'

const Moment = require('moment')

const EntityApi = require('./entity-api')
const ActivityApi = require('../api/activities')
const RiversApi = require('../api/rivers')
const MethodsApi = require('../api/methods')
const SpeciesApi = require('../api/species')

const activityApi = new ActivityApi()
const riversApi = new RiversApi()
const methodsApi = new MethodsApi()
const speciesApi = new SpeciesApi()

/**
 * Catches entity handler
 *
 */
module.exports = class CatchesApi extends EntityApi {
  constructor () {
    super('catches', async (request, c) => {
      const activity = await activityApi.getFromLink(request, c._links.activity.href)
      const river = await riversApi.getFromLink(request, activity._links.river.href)
      const species = await speciesApi.getFromLink(request, c._links.species.href)
      const method = await methodsApi.getFromLink(request, c._links.method.href)
      return {
        id: EntityApi.keyFromLink(c),
        dateCaught: c.dateCaught,
        released: c.released,
        mass: c.mass,
        reportingExclude: c.reportingExclude,
        onlyMonthRecorded: c.onlyMonthRecorded,
        noDateRecorded: c.noDateRecorded,
        activity: {
          id: EntityApi.keyFromLink(activity),
          days: activity.days,
          river: {
            id: EntityApi.keyFromLink(river),
            name: river.name
          }
        },
        species: {
          id: EntityApi.keyFromLink(species),
          name: species.name
        },
        method: {
          id: EntityApi.keyFromLink(method),
          name: method.name
        }
      }
    })
  }

  async add (request, submissionId, activityId, dateCaught, speciesId, mass, methodId, released,
    onlyMonthRecorded, noDateRecorded) {
    return super.add(request, {
      submission: submissionId,
      activity: activityId,
      dateCaught: dateCaught,
      species: speciesId,
      mass: mass,
      method: methodId,
      released: released,
      onlyMonthRecorded: onlyMonthRecorded,
      noDateRecorded: noDateRecorded
    })
  }

  async change (request, catchId, activityId, dateCaught, speciesId, mass, methodId, released,
    onlyMonthRecorded, noDateRecorded) {
    const result = await super.change(request, catchId, {
      dateCaught: dateCaught,
      mass: mass,
      released: released,
      species: speciesId,
      method: methodId,
      onlyMonthRecorded: onlyMonthRecorded,
      noDateRecorded: noDateRecorded
    })

    if (Object.keys(result).includes('errors')) {
      return result
    }

    const mappedResult = await this.doMap(request, result)

    // Change the activity if necessary
    if (mappedResult.activity.id !== activityId) {
      await super.changeAssoc(request, catchId + '/activity', activityId)
    }

    return result
  }

  async changeExclusion (request, catchId, reportingExclude) {
    return super.change(request, catchId, {
      reportingExclude: reportingExclude
    })
  }

  sort (a, b) {
    if (Moment(a.dateCaught, 'YYYY-MM-DD').unix() < Moment(b.dateCaught, 'YYYY-MM-DD').unix()) {
      return -1
    }

    if (Moment(a.dateCaught, 'YYYY-MM-DD').unix() > Moment(b.dateCaught, 'YYYY-MM-DD').unix()) {
      return 1
    }

    if (a.activity.river.name < b.activity.river.name) {
      return -1
    }

    if (a.activity.river.name > b.activity.river.name) {
      return 1
    }

    return 0
  }
}
