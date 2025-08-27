const { filterAvailableRivers } = require('../../src/lib/river-utils')

describe('filterAvailableRivers', () => {
  const getAllRivers = () => ([
    { id: 1, name: 'Amman' },
    { id: 2, name: 'Avon' },
    { id: 3, name: 'Brathay' },
    { id: 4, name: 'Cefni' },
    { id: 5, name: 'Cleifon' },
    { id: 6, name: 'Coquet' }
  ])

  const getAllActivities = () => ([
    { id: 1, river: { id: 4 } },
    { id: 2, river: { id: 6 } },
    { id: 3, river: { id: 3 } }
  ])

  const getCurrentActivity = () => ({
    id: 1, river: { id: 4 }
  })

  it('filters out rivers already used, except allows current activity river', () => {
    const result = filterAvailableRivers(getAllRivers(), getAllActivities(), getCurrentActivity())

    expect(result).toEqual([
      { id: 1, name: 'Amman' },
      { id: 2, name: 'Avon' },
      { id: 4, name: 'Cefni' },
      { id: 5, name: 'Cleifon' }
    ])
  })

  it('returns all rivers if no activities exist', () => {
    const rivers = getAllRivers()

    const result = filterAvailableRivers(rivers, [], getCurrentActivity())

    expect(result).toEqual(rivers)
  })

  it('returns only current river if all others are used', () => {
    const activities = [
      { id: 1, river: { id: 4 } },
      { id: 2, river: { id: 6 } },
      { id: 3, river: { id: 2 } },
      { id: 4, river: { id: 1 } },
      { id: 5, river: { id: 3 } },
      { id: 6, river: { id: 5 } }
    ]

    const result = filterAvailableRivers(
      getAllRivers(),
      activities,
      getCurrentActivity()
    )

    expect(result).toEqual([{ id: 4, name: 'Cefni' }])
  })
})
