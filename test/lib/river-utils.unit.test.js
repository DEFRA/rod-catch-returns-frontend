const { filterRiversForAdd, filterRiversForChange } = require('../../src/lib/river-utils')

describe('river-utils.unit', () => {
  const getAllRivers = () => ([
    { id: 1, name: 'Amman' },
    { id: 2, name: 'Avon' },
    { id: 3, name: 'Brathay' },
    { id: 4, name: 'Cefni' },
    { id: 5, name: 'Cleifon' },
    { id: 6, name: 'Coquet' }
  ])

  const getSomeActivities = () => ([
    { id: 1, river: { id: 4 } },
    { id: 2, river: { id: 6 } },
    { id: 3, river: { id: 3 } }
  ])

  const getAllActivities = () => ([
    { id: 1, river: { id: 4 } },
    { id: 2, river: { id: 6 } },
    { id: 3, river: { id: 2 } },
    { id: 4, river: { id: 1 } },
    { id: 5, river: { id: 3 } },
    { id: 6, river: { id: 5 } }
  ])

  describe('filterRiversForAdd', () => {
    it('filters out rivers already used by activities', () => {
      const result = filterRiversForAdd(getAllRivers(), getSomeActivities())

      expect(result).toEqual([
        { id: 1, name: 'Amman' },
        { id: 2, name: 'Avon' },
        { id: 5, name: 'Cleifon' }
      ])
    })

    it('returns all rivers if no activities exist', () => {
      const rivers = getAllRivers()

      const result = filterRiversForAdd(rivers, [])

      expect(result).toEqual(rivers)
    })

    it('returns empty array if all rivers are already used', () => {
      const result = filterRiversForAdd(getAllRivers(), getAllActivities())

      expect(result).toEqual([])
    })
  })

  describe('filterRiversForChange', () => {
    const getCurrentActivity = () => ({
      id: 1, river: { id: 4 }
    })

    it('filters out rivers already used, except allows current activity river', () => {
      const result = filterRiversForChange(getAllRivers(), getSomeActivities(), getCurrentActivity())

      expect(result).toEqual([
        { id: 1, name: 'Amman' },
        { id: 2, name: 'Avon' },
        { id: 4, name: 'Cefni' },
        { id: 5, name: 'Cleifon' }
      ])
    })

    it('returns all rivers if no activities exist', () => {
      const rivers = getAllRivers()

      const result = filterRiversForChange(rivers, [], getCurrentActivity())

      expect(result).toEqual(rivers)
    })

    it('returns only current river if all others are used', () => {
      const result = filterRiversForChange(
        getAllRivers(),
        getAllActivities(),
        getCurrentActivity()
      )

      expect(result).toEqual([{ id: 4, name: 'Cefni' }])
    })
  })
})
