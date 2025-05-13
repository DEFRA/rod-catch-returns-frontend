const msal = require('@azure/msal-node')

/** @type {msal.Configuration} */
const config = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID,
    clientSecret: process.env.MSAL_CLIENT_SECRET,
    authority: process.env.MSAL_ENDPOINT
  }
}

const msalClient = new msal.ConfidentialClientApplication(config)

module.exports = {
  msalClient
}
