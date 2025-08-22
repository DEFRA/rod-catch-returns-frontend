const getMockH = () => ({
  redirect: jest.fn(),
  view: jest.fn(),
  response: jest.fn().mockImplementation((payload) => ({
    code: (statusCode) => ({ payload, statusCode })
  }))
})

module.exports = {
  getMockH
}
