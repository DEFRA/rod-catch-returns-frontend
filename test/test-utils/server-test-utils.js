const getMockH = (overrides) => ({
  redirect: jest.fn(),
  view: jest.fn(),
  response: jest.fn().mockImplementation((payload) => ({
    code: (statusCode) => ({ payload, statusCode })
  })),
  continue: 'response',
  ...overrides
})

module.exports = {
  getMockH
}
