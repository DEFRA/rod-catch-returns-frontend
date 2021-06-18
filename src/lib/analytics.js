const Crypto = require('crypto')
const salt = Crypto.randomBytes(16)

const staticMatcherPublic = /^(?:\/public\/.*|\/robots.txt|\/favicon.ico)/
const isStaticResource = request => staticMatcherPublic.test(request.path)

const sessionIdProducer = (request) => {
  let hash = null
  if (!isStaticResource(request)) {
    const ip = request.info.remoteAddress
    const ua = request.headers['user-agent']

    hash = Crypto.createHash('sha256')
      .update(ip + ua)
      .update(salt)
      .digest('base64')
  }
  return hash
}
module.exports = {
  sessionIdProducer,
  isStaticResource
}
