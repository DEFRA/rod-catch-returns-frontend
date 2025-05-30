const msal = require('@azure/msal-node')
const axios = require('axios')
const { HttpsProxyAgent } = require('https-proxy-agent')

const proxyUrl = process.env.https_proxy
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

/**
 * Sends an HTTP request using axios, with optional proxy support
 * @param {'get'|'post'} method - The HTTP method
 * @param {string} url - The request URL
 * @param {{ headers: Record<string, string>, body?: any }} options - Request options
 * @returns {Promise<{ headers: any, body: any, status: number }>}
 */
const sendRequest = async (method, url, options) => {
  const axiosOptions = {
    method,
    url,
    headers: options.headers,
    ...(options.body && { data: options.body }),
    ...(proxyAgent && { httpsAgent: proxyAgent })
  }

  const res = await axios(axiosOptions)

  return {
    headers: res.headers,
    body: res.data,
    status: res.status
  }
}

const loggerCallback = (level, message, containsPii) => {
  if (containsPii) return
  switch (level) {
    case msal.LogLevel.Error:
      console.error(message)
      break
    case msal.LogLevel.Info:
    case msal.LogLevel.Verbose:
    case msal.LogLevel.Warning:
      console.log(message)
      break
  }
}

// Define optional loggerOptions only in development
const loggerOptions =
  process.env.NODE_ENV === 'development'
    ? {
      logLevel: msal.LogLevel.Verbose,
      loggerCallback,
      piiLoggingEnabled: false
    }
    : undefined

/** @type {msal.Configuration} */
const config = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID,
    clientSecret: process.env.MSAL_CLIENT_SECRET,
    authority: process.env.MSAL_ENDPOINT
  },
  system: {
    ...(loggerOptions && { loggerOptions }),
    /*
     * Workaround use native axios with our proxy settings
     * Original HTTP client used by msal-node: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/src/network/HttpClient.ts
     * Github issue related: https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/6527#issuecomment-2073238927
     */
    networkClient: {
      sendGetRequestAsync: async (url, options) => sendRequest('get', url, options),
      sendPostRequestAsync: async (url, options) => sendRequest('post', url, options)
    }
  }
}

const msalClient = new msal.ConfidentialClientApplication(config)

module.exports = {
  msalClient
}
