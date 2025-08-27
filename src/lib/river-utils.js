const RiversApi = require('../api/rivers')

const riversApi = new RiversApi()

/**
 * Get rivers not yet used in any activity.
 *
 * @param {Array} rivers - All available rivers
 * @param {Array} activities - Existing activities
 * @returns {Array} Filtered rivers
 */
function filterRiversForAdd (rivers, activities) {
  const riversFished = activities.map(a => a.river.id)
  return rivers.filter(r => !riversFished.includes(r.id))
}

/**
 * Filter rivers so that only rivers not already used by activities are included,
 * except the current activity’s river which remains selectable.
 *
 * @param {Array} rivers - All available rivers
 * @param {Array} activities - Existing activities
 * @param {Object} currentActivity - The activity being edited
 * @returns {Array} Filtered rivers
 */
function filterRiversForChange (rivers, activities, currentActivity) {
  const usedRiverIds = activities
    .map(a => a.river.id)
    .filter(id => id !== currentActivity.river.id) // exclude the river for the current activity

  const usedSet = new Set(usedRiverIds)

  return rivers.filter(r => !usedSet.has(r.id)).sort(riversApi.sort)
}

module.exports = {
  filterRiversForAdd,
  filterRiversForChange
}
