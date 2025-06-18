/* eslint-disable no-undef */
(function () {
  // inter-exclusion check box behaviour
  'use strict'
  document.addEventListener('DOMContentLoaded', function () {
    const submitButton = document.getElementsByName('continue')[0]
    const saveButton = document.getElementsByName('save')[0]
    let activeRequests = 0

    const setButtonState = () => {
      if (submitButton) {
        submitButton.disabled = activeRequests > 0
      }
      if (saveButton) {
        saveButton.disabled = activeRequests > 0
      }
    }

    let exclude = document.getElementById('exclude-1')
    let catchExcludes = document.getElementsByName('exclude-catch')
    let smallCatchExcludes = document.getElementsByName('exclude-small-catch')
    let hid = document.getElementsByName('rcr2018')
    let csrf = hid[0].value

    let serverUpdateExclusion = function (message) {
      activeRequests++
      setButtonState()

      let client = new XMLHttpRequest()
      client.open('POST', '/exclusions')
      client.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
      client.setRequestHeader('X-CSRF-Token', csrf)
      client.onreadystatechange = function () {
        if (client.readyState === 4) {
          activeRequests--
          setButtonState()

          if (client.status === 200) {
            let response = JSON.parse(client.responseText)
            Object.keys(response).forEach(function (flag) {
              let exclude = document.getElementById(flag)
              exclude.checked = response[flag]
            })
          }
        }
      }
      client.send(JSON.stringify(message))
    }

    let lineListener = function () {
      let payload = {}
      payload[this.id] = this.checked
      serverUpdateExclusion(payload)
    }

    // Add listener for all return exclude checkbox
    exclude.addEventListener('change', function () {
      let payload = {}
      payload[this.id] = this.checked
      serverUpdateExclusion(payload)
    })

    // Add listeners for large catch excludes
    for (let i = 0; i < catchExcludes.length; i++) {
      catchExcludes[i].addEventListener('change', lineListener)
    }

    // Add listeners for small catch excludes
    for (let i = 0; i < smallCatchExcludes.length; i++) {
      smallCatchExcludes[i].addEventListener('change', lineListener)
    }
  })
}).call(this)
