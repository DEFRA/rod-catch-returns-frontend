const msal = require('@azure/msal-node')

/** @type {msal.Configuration} */
const config = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID,
    clientSecret: process.env.MSAL_CLIENT_SECRET,
    authority: process.env.MSAL_ENDPOINT,
    redirectUri: process.env.MSAL_REDIRECT_URI
  }
}

const msalClient = new msal.ConfidentialClientApplication(config)
