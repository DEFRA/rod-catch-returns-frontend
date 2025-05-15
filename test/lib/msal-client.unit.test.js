const { msalClient } = require('../../src/lib/msal-client')
const msal = require('@azure/msal-node')

jest.mock('@azure/msal-node', () => {
  const mockInstance = {}

  const MockConfidentialClientApplication = jest.fn().mockImplementation(() => mockInstance)

  return {
    ConfidentialClientApplication: MockConfidentialClientApplication,
    LogLevel: {
      Verbose: 'verbose'
    }
  }
})

jest.mock('@azure/msal-node')

describe('msal-client', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should have msalClient as msal.ConfidentialClientApplication', () => {
    expect(msalClient).toBe(msal.ConfidentialClientApplication.mock.results[0].value)
  })

  it('should initialise msal with the correct config', () => {
    expect(msal.ConfidentialClientApplication).toHaveBeenCalledWith({
      auth: {
        clientId: 'mock-client-id',
        clientSecret: 'mock-client-secret',
        authority: 'https://login.microsoftonline.com/mock-tenant-id'
      }
    })
  })
})
