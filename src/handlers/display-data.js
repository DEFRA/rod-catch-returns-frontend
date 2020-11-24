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

function mapSmallCatch (activities) {
  return c => {
    c.month = monthHelper.find.textFromNum(c.month)
    c.river = c.activity.river.name
    const activity = activities.find(a => a.id === c.activity.id)
    c.counts.forEach(t => {
      c[t.name.toLowerCase()] = t.count
      activity.count += t.count || 0
    })
    delete c.counts
    return c
  }
}

function mapLargeCatch (activities) {
  return c => {
    c.dateCaught = Moment(c.dateCaught).format('DD/MM')
    c.weight = printWeight(c)
    const activity = activities.find(a => a.id === c.activity.id)
    activity.count++
    return c
  }
}

function addRowSpansForLargeCatch (catchIsEqual, riverIsEqual) {
  return (val, idx, arr) => {
    val.rowspan = arr.filter(ent => catchIsEqual(ent, val)).length
    val.riverRowspan = arr.filter(ent => riverIsEqual(ent, val)).length

    arr.filter(ent => catchIsEqual(ent, val))
      .forEach((elem, idx1, arr2) => (arr2[idx1].hide = idx1 !== 0))

    arr.filter(ent => riverIsEqual(ent, val))
      .forEach((elem, idx1, arr2) => (arr2[idx1].riverHide = idx1 !== 0))
  }
}

function addRowSpansForSmallCatch (smallCatchIsEqual) {
  return (val, idx, arr) => {
    val.rowspan = arr.filter(ent => smallCatchIsEqual(ent, val)).length

    arr.filter(ent => smallCatchIsEqual(ent, val))
      .forEach((elem, idx1, arr2) => (arr2[idx1].hide = idx1 !== 0))
  }
}

module.exports = async (request, submission) => {
  // Get the activities
  const activities = (await activitiesApi.getFromLink(request, submission._links.activities.href))
    .sort(activitiesApi.sort)

  // Process the catches for the summary view
  const catches = (await catchesApi.getAllChildren(request, activities, '_links.catches.href'))
    .sort(catchesApi.sort)
    .map(mapLargeCatch(activities))

  const catchIsEqual = (a, b) => process.env.CONTEXT === 'ANGLER'
    ? a.dateCaught === b.dateCaught
    : a.dateCaught === b.dateCaught && ((b.onlyMonthRecorded || b.noDateRecorded) === (a.onlyMonthRecorded || a.noDateRecorded))

  const riverIsEqual = (a, b) => catchIsEqual(a, b) &&
    a.activity.river.id === b.activity.river.id

  // Add show flag and rowspan for customized table template
  catches.forEach(addRowSpansForLargeCatch(catchIsEqual, riverIsEqual))

  // Process the small catches flattening the counts
  const allChildren = await smallCatchesApi.getAllChildren(request, activities, '_links.smallCatches.href')

  // Need to show the unknown method if set by the administrator
  const foundInternal = !!allChildren.find(c => c.counts.find(c2 => c2.internal && c2.count))

  const smallCatches = allChildren.sort(smallCatchesApi.sort)
    .map(mapSmallCatch(activities))

  const smallCatchIsEqual = (a, b) => process.env.CONTEXT === 'ANGLER'
    ? a.month === b.month
    : a.month === b.month && a.noMonthRecorded === b.noMonthRecorded

  // Add show flag and rowspan for customized table template
  smallCatches.forEach(addRowSpansForSmallCatch(smallCatchIsEqual))

  return {
    activities: activities,
    catches: catches,
    smallCatches: smallCatches,
    foundInternal: foundInternal
  }
}
