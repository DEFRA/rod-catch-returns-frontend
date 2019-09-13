'use strict'

/**
 * Reusable fragments for tests
 * @type {string}
 */

const LICENCE = String('B7A718')
const POSTCODE = String('WA48HT')

const moment = require('moment')

const YEAR = moment().year()
const THISMONTH = moment().month() + 1
const NEXTMONTH = moment().add(1, 'months').month() + 1

const YESTERDAY = moment().subtract(1, 'days')
const TOMORROW = moment().add(1, 'days')

const FMTUSER = String('admin1@example.com')
const FMTPASS = String('admin')

console.log(`Using last month: ${THISMONTH}`)
console.log(`Using next month: ${NEXTMONTH}`)
console.log(`Using yesterday: ${YESTERDAY.toISOString()}`)
console.log(`Using tomorrow: ${TOMORROW.toISOString()}`)

module.exports = {
  LICENCE: LICENCE,
  POSTCODE: POSTCODE,

  start: [
    { method: 'GET', path: '/', status: 302, redirect: '/licence-auth' },
    { method: 'GET', path: '/licence-auth', status: 200 }
  ],

  signInSuccess: [
    { method: 'GET', path: '/licence-auth', status: 200 },
    { method: 'POST', path: '/licence-auth', status: 302, payload: { licence: LICENCE, postcode: POSTCODE }, redirect: '/select-year' },
    { method: 'GET', path: '/select-year', status: 200 },
    { method: 'POST', path: '/select-year', status: 302, payload: { year: YEAR }, redirect: '/did-you-fish' },
    { method: 'GET', path: '/did-you-fish', status: 200 },
    { method: 'POST', path: '/did-you-fish', status: 302, payload: { dyf: 'YES' }, redirect: '/summary' }
  ],
  signInWithActivity: [
    { method: 'GET', path: '/licence-auth', status: 200 },
    { method: 'POST', path: '/licence-auth', status: 302, payload: { licence: LICENCE, postcode: POSTCODE }, redirect: '/select-year' },
    { method: 'GET', path: '/select-year', status: 200 },
    { method: 'POST', path: '/select-year', status: 302, payload: { year: YEAR }, redirect: '/did-you-fish' },
    { method: 'GET', path: '/did-you-fish', status: 302, redirect: '/summary' }
  ],
  signInFail: [
    { method: 'POST', path: '/licence-auth', status: 302, payload: { licence: 'A7A718', postcode: 'WA4 1HT' }, redirect: '/licence-auth-fail' }
  ],
  signInToLocked: [
    { method: 'GET', path: '/licence-auth', status: 200 },
    { method: 'POST', path: '/licence-auth', status: 302, payload: { licence: LICENCE, postcode: POSTCODE }, redirect: '/select-year' },
    { method: 'GET', path: '/select-year', status: 200 },
    { method: 'POST', path: '/select-year', status: 302, payload: { year: YEAR }, redirect: '/did-you-fish' },
    { method: 'GET', path: '/did-you-fish', status: 302, redirect: '/review' },
    { method: 'GET', path: '/review', status: 200 }
  ],
  addActivityRiverSawdde: [
    { method: 'GET', path: '/activities/add', status: 200 },
    { method: 'POST', path: '/activities/add', payload: { river: 'rivers/189', daysFishedOther: '7', daysFishedWithMandatoryRelease: '0' }, status: 302, redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  addActivityRiverErrors: [
    { method: 'GET', path: '/activities/add', status: 200 },
    { method: 'POST', path: '/activities/add', payload: { river: '', daysFishedOther: '1000', daysFishedWithMandatoryRelease: '' }, status: 302, redirect: '/activities/add' }
  ],
  editActivityRiverSawdde: [
    { method: 'GET', path: '/activities/1', status: 200 },
    { method: 'POST', path: '/activities/1', payload: { river: 'rivers/190', daysFishedOther: '3', daysFishedWithMandatoryRelease: '10' }, status: 302, redirect: '/summary' }
  ],
  addActivityRiverEbbw: [
    { method: 'GET', path: '/activities/add', status: 200 },
    { method: 'POST', path: '/activities/add', payload: { river: 'rivers/87', daysFishedOther: '6', daysFishedWithMandatoryRelease: '2' }, status: 302, redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  addActivityRiverAmman: [
    { method: 'GET', path: '/activities/add', status: 200 },
    { method: 'POST', path: '/activities/add', payload: { river: 'rivers/11', daysFishedOther: '2', daysFishedWithMandatoryRelease: '0' }, status: 302, redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  deleteActivityRiverEbbw: [
    { method: 'GET', path: '/delete/activities/2', status: 200 },
    { method: 'POST', path: '/delete/activities/2', payload: {}, status: 302, redirect: '/summary' }
  ],

  addSmallCatch1: [
    { method: 'GET', path: '/small-catches/add', status: 200 },
    { method: 'POST',
      path: '/small-catches/add',
      payload: { river: 'rivers/190', month: THISMONTH.toString(), fly: '5', spinner: '2', bait: '', released: '1' },
      status: 302,
      redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  addSmallCatch2: [
    { method: 'GET', path: '/small-catches/add', status: 200 },
    { method: 'POST',
      path: '/small-catches/add',
      payload: { river: 'rivers/11', month: THISMONTH.toString(), fly: '', spinner: '2', bait: '', released: '1' },
      status: 302,
      redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  editSmallCatch1: [
    { method: 'GET', path: '/small-catches/1', status: 200 },
    { method: 'POST',
      path: '/small-catches/1',
      payload: { river: 'rivers/190', month: THISMONTH.toString(), fly: '2', spinner: '2', bait: '1', released: '2' },
      status: 302,
      redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  removeSmallCatch1: [
    { method: 'GET', path: '/delete/small-catches/1', status: 200 },
    { method: 'POST', path: '/delete/small-catches/1', payload: {}, status: 302, redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  removeSmallCatch2: [
    { method: 'GET', path: '/delete/small-catches/2', status: 200 },
    { method: 'POST', path: '/delete/small-catches/2', payload: {}, status: 302, redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  addSmallCatchWithErrors1: [
    { method: 'GET', path: '/small-catches/add', status: 200 },
    { method: 'POST',
      path: '/small-catches/add',
      payload: { river: 'rivers/190', month: '', fly: 'a', spinner: '', bait: '', released: '' },
      status: 302,
      redirect: '/small-catches/add' },
    { method: 'GET', path: '/small-catches/add', status: 200 }
  ],
  addSmallCatchWithErrors2: [
    { method: 'GET', path: '/summary', status: 200 }, // Clear cache
    { method: 'GET', path: '/small-catches/add', status: 200 },
    { method: 'POST',
      path: '/small-catches/add',
      payload: { river: 'rivers/11', month: NEXTMONTH.toString(), fly: '-2', spinner: '0', bait: '0', released: '22', add: 'add' },
      status: 302,
      redirect: '/small-catches/add' },
    { method: 'GET', path: '/small-catches/add', status: 200 }
  ],

  addLargeCatch1: [
    { method: 'GET', path: '/catches/add', status: 200 },
    { method: 'POST',
      path: '/catches/add',
      payload: {
        river: 'rivers/190',
        day: YESTERDAY.date().toString(),
        month: (YESTERDAY.month() + 1).toString(),
        type: 'species/1',
        system: 'IMPERIAL',
        pounds: '1',
        ounces: '2',
        kilograms: '',
        method: 'methods/2',
        released: 'true'
      },
      status: 302,
      redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  addLargeCatch2: [
    { method: 'GET', path: '/catches/add', status: 200 },
    { method: 'POST',
      path: '/catches/add',
      payload: {
        river: 'rivers/11',
        day: YESTERDAY.date().toString(),
        month: (YESTERDAY.month() + 1).toString(),
        type: 'species/1',
        system: 'IMPERIAL',
        pounds: '1',
        ounces: '2',
        kilograms: '',
        method: 'methods/2',
        released: 'true'
      },
      status: 302,
      redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  editLargeCatch1: [
    { method: 'GET', path: '/catches/1', status: 200 },
    { method: 'POST',
      path: '/catches/1',
      payload: {
        river: 'rivers/190',
        day: YESTERDAY.date().toString(),
        month: (YESTERDAY.month() + 1).toString(),
        type: 'species/2',
        system: 'IMPERIAL',
        pounds: '1',
        ounces: '3',
        kilograms: '',
        method: 'methods/1',
        released: 'false'
      },
      status: 302,
      redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  editLargeCatch2: [
    { method: 'GET', path: '/catches/1', status: 200 },
    { method: 'POST',
      path: '/catches/2',
      payload: {
        river: 'rivers/190',
        day: YESTERDAY.date().toString(),
        month: (YESTERDAY.month() + 1).toString(),
        type: 'species/2',
        system: 'IMPERIAL',
        pounds: '1',
        ounces: '3',
        kilograms: '',
        method: 'methods/1',
        released: 'false'
      },
      status: 302,
      redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  deleteLargeCatch1: [
    { method: 'GET', path: '/delete/catches/1', status: 200 },
    { method: 'POST', path: '/delete/catches/1', payload: {}, status: 302, redirect: '/summary' }
  ],
  deleteLargeCatch2: [
    { method: 'GET', path: '/delete/catches/2', status: 200 },
    { method: 'POST', path: '/delete/catches/2', payload: {}, status: 302, redirect: '/summary' }
  ],
  addLargeCatchWithErrors1: [
    { method: 'GET', path: '/catches/add', status: 200 },
    { method: 'POST',
      path: '/catches/add',
      payload: {
        river: 'rivers/190',
        day: '1',
        month: '13',
        type: 'species/1',
        system: 'IMPERIAL',
        pounds: '1',
        ounces: '2',
        kilograms: '',
        method: 'methods/2',
        released: 'true'
      },
      status: 302,
      redirect: '/catches/add' }
  ],
  addLargeCatchWithErrors2: [
    { method: 'GET', path: '/summary', status: 200 },
    { method: 'GET', path: '/catches/add', status: 200 },
    { method: 'POST',
      path: '/catches/add',
      payload: {
        river: 'rivers/190',
        day: TOMORROW.date().toString(),
        month: (TOMORROW.month() + 1).toString(),
        type: 'species/1',
        system: 'METRIC',
        pounds: '',
        ounces: '',
        kilograms: '150',
        method: 'methods/2',
        released: 'true',
        add: 'add'
      },
      status: 302,
      redirect: '/catches/add' },
    { method: 'GET', path: '/catches/add', status: 200 }
  ],
  save: [
    { method: 'GET', path: '/summary', status: 200 },
    { method: 'GET', path: '/save', status: 200 }
  ],
  reviewAndSubmit: [
    { method: 'GET', path: '/summary', status: 200 },
    { method: 'POST', path: '/summary', payload: {}, status: 302, redirect: '/review' },
    { method: 'GET', path: '/review', status: 200 },
    { method: 'POST', path: '/review', payload: { continue: '' }, status: 302, redirect: '/confirmation' },
    { method: 'GET', path: '/confirmation', status: 200 }
  ],
  fmtStart: [
    { method: 'GET', path: '/', status: 302, redirect: '/login' },
    { method: 'GET', path: '/login', status: 200 }
  ],
  fmtSignInFail: [
    { method: 'GET', path: '/login', status: 200 },
    { method: 'POST', path: '/login', payload: { user: 'NOT-FOUND', password: 'AAA' }, status: 302, redirect: '/login-fail' },
    { method: 'GET', path: '/login-fail', status: 200 }
  ],
  fmtSignIn: [
    { method: 'GET', path: '/login?next=/login-fail', status: 200 },
    { method: 'POST', path: '/login', payload: { user: FMTUSER, password: FMTPASS }, status: 302, redirect: '/licence' },
    { method: 'GET', path: '/licence', status: 200 }
  ],
  fmtSelectLicence: [
    { method: 'GET', path: '/licence', status: 200 },
    { method: 'POST', path: '/licence', status: 302, payload: { licence: 'junk', postcode: 'junk' }, redirect: '/licence' },
    { method: 'GET', path: '/licence', status: 200 },
    { method: 'POST', path: '/licence', status: 302, payload: { licence: LICENCE, postcode: POSTCODE }, redirect: '/select-year' },
    { method: 'GET', path: '/select-year', status: 200 },
    { method: 'POST', path: '/select-year', status: 302, payload: { year: YEAR }, redirect: '/did-you-fish' },
    { method: 'GET', path: '/did-you-fish', status: 302, redirect: '/review' },
    { method: 'GET', path: '/review', status: 200 }
  ],
  fmtSignOut: [
    { method: 'GET', path: '/logout', status: 302, redirect: '/' },
    { method: 'GET', path: '/', status: 302, redirect: '/login' },
    { method: 'GET', path: '/login', status: 200 }
  ],
  fmtUnlockLicence: [
    { method: 'GET', path: '/review', status: 200 },
    { method: 'POST', path: '/review', status: 302, payload: { unlock: 'unlock' }, redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 }
  ],
  fmtExclude: [
    { method: 'GET', path: '/summary', status: 200 },
    { method: 'GET', path: '/catches/add', status: 200 },
    { method: 'POST',
      path: '/catches/add',
      payload: {
        river: 'rivers/190',
        day: YESTERDAY.date().toString(),
        month: (YESTERDAY.month() + 1).toString(),
        type: 'species/1',
        system: 'IMPERIAL',
        pounds: '1',
        ounces: '2',
        kilograms: '',
        method: 'methods/2',
        released: 'true'
      },
      status: 302,
      redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 },
    { method: 'GET', path: '/small-catches/add', status: 200 },
    { method: 'POST',
      path: '/small-catches/add',
      payload: { river: 'rivers/190', month: THISMONTH.toString(), fly: '5', spinner: '2', bait: '', released: '1' },
      status: 302,
      redirect: '/summary' },
    { method: 'GET', path: '/summary', status: 200 },
    { method: 'POST', path: '/exclusions', status: 200, payload: { 'exclude-smallCatches/3': 'true' } },
    { method: 'POST', path: '/exclusions', status: 200, payload: { 'exclude-catches/3': 'true' } },
    { method: 'POST', path: '/exclusions', status: 200, payload: { 'exclude-smallCatches/3': 'false' } },
    { method: 'POST', path: '/exclusions', status: 200, payload: { 'exclude-catches/3': 'false' } },
    { method: 'POST', path: '/exclusions', status: 200, payload: { 'exclude-1': 'true' } },
    { method: 'POST', path: '/exclusions', status: 200, payload: { 'exclude-1': 'false' } },
    { method: 'GET', path: '/review', status: 200 },
    { method: 'POST', path: '/review', payload: { continue: '' }, status: 302, redirect: '/confirmation' },
    { method: 'GET', path: '/confirmation', status: 200 }
  ],
  fmtLookupSubmission: [
    { method: 'GET', path: '/lookup?submissionId=submissions/1', status: 302, redirect: '/summary' }
  ]
}
