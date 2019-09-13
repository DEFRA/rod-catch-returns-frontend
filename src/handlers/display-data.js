'use strict'

/**
 * Used to process data into humen readable format for both summary and review pages
 */
const CatchesApi = require('../api/catches')
const SmallCatchesApi = require('../api/small-catches')
const ActivitiesApi = require('../api/activities')

const catchesApi = new CatchesApi()
const smallCatchesApi = new SmallCatchesApi()
const activitiesApi = new ActivitiesApi()

const Moment = require('moment')
const { monthHelper, printWeight } = require('./common')

module.exports = async (request, submission) => {
  // Get the activities
  const activities = (await activitiesApi.getFromLink(request, submission._links.activities.href))
    .sort(activitiesApi.sort)

  // Add a count to the activities
  activities.map(a => { a.count = 0 })

  // Process the catches for the summary view
  const catches = (await catchesApi.getAllChildren(request, activities, '_links.catches.href'))
    .sort(catchesApi.sort)
    .map(c => {
      c.dateCaught = Moment(c.dateCaught).format('DD/MM')
      c.weight = printWeight(c)
      const activity = activities.find(a => a.id === c.activity.id)
      activity.count++
      return c
    })

  // Need to show the unknown method if set by the administrator
  let foundInternal = false

  // Process the small catches flattening the counts
  const smallCatches = (await smallCatchesApi.getAllChildren(request, activities, '_links.smallCatches.href'))
    .sort(smallCatchesApi.sort)
    .map(c => {
      c.month = monthHelper.find.textFromNum(c.month)
      c.river = c.activity.river.name
      const activity = activities.find(a => a.id === c.activity.id)
      c.counts.forEach(t => {
        c[t.name.toLowerCase()] = t.count
        activity.count += t.count || 0
      })
      foundInternal = foundInternal || !!c.counts.find(m => m.internal)
      delete c.counts
      return c
    })

  return {
    activities: activities,
    catches: catches,
    smallCatches: smallCatches,
    foundInternal: foundInternal
  }
}
