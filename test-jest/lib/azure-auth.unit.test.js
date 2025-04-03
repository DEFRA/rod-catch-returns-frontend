const mockGetAuthCodeUrl = jest.fn()
const mockAcquireTokenByCode = jest.fn()
const mockAcquireTokenSilent = jest.fn()
const mockGetTokenCache = jest.fn()

const azureAuth = require('../../src/lib/azure-auth')
const msal = require('@azure/msal-node')

jest.mock('@azure/msal-node', () => {
  return {
    ConfidentialClientApplication: jest.fn().mockImplementation(() => {
      return {
        getAuthCodeUrl: mockGetAuthCodeUrl,
        acquireTokenByCode: mockAcquireTokenByCode,
        acquireTokenSilent: mockAcquireTokenSilent,
        getTokenCache: mockGetTokenCache
      }
    }),
    LogLevel: {
      Verbose: 'verbose'
    }
  }
})

jest.mock('@azure/msal-node')

describe('azure-auth', () => {
  beforeEach(() => {
    jest.resetModules()
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

  describe('getAuthenticationUrl', () => {
    test('should call getAuthCodeUrl with the correct config', async () => {
      await azureAuth.getAuthenticationUrl()
      expect(mockGetAuthCodeUrl).toHaveBeenCalledWith({
        redirectUri: 'http://localhost/mock-redirect',
        responseMode: 'form_post'
      })
    })

    test('should return the correct url', async () => {
      mockGetAuthCodeUrl.mockResolvedValueOnce('https://mock-auth-url')
      await expect(
        azureAuth.getAuthenticationUrl()
      ).resolves.toBe('https://mock-auth-url')
    })
  })
})
