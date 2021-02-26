'use strict'

const EntityApi = require('./entity-api')

/**
 * Submission entity handler
 *
 */
module.exports = class SubmissionsApi extends EntityApi {
  constructor () {
    super('submissions', async (request, e) => {
      return {
        id: EntityApi.keyFromLink(e),
        name: e.name,
        season: e.season
      }
    })
  }

  async add (request, contactId, year) {
    return super.add(request, {
      contactId: contactId,
      season: year,
      status: 'INCOMPLETE',
      source: process.env.CONTEXT === 'ANGLER' ? 'WEB' : 'PAPER'
    })
  }

  async getByContactIdAndYear (request, contactId, year) {
    return super.searchFunction(request, 'getByContactIdAndSeason', `contact_id=${contactId}&season=${year}`)
  }

  async getByContactId (request, contactId) {
    return super.searchFunction(request, 'findByContactId', `contact_id=${contactId}`)
  }

  async setSubmitted (request, submissionId) {
    return super.change(request, submissionId, { status: 'SUBMITTED' })
  }

  async setIncomplete (request, submissionId) {
    return super.change(request, submissionId, { status: 'INCOMPLETE' })
  }

  async changeExclusion (request, submissionId, reportingExclude) {
    return super.change(request, submissionId, {
      reportingExclude: reportingExclude
    })
  }
}
