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

const getAuthenticationUrl = async () => {
  const authUrl = await msalClient.getAuthCodeUrl({
    redirectUri: process.env.MSAL_REDIRECT_URI,
    responseMode: 'form_post'
  })
  return authUrl
}

module.exports = {
  getAuthenticationUrl
}
