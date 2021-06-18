const crypto = require('crypto')
const salt = crypto.randomBytes(16)

const staticMatcherPublic = /^(?:\/public\/.*|\/robots.txt|\/favicon.ico)/
const isStaticResource = request => staticMatcherPublic.test(request.path)

const sessionIdProducer = (request) => {
  let id = null
  if (!isStaticResource(request)) {
    const ip = request.info.remoteAddress
    const ua = request.headers['user-agent']

    const hash = crypto.createHash('sha256')
    id = hash.update(ip + ua)
      .update(salt)
      .digest('base64')
  }
  return id
}
module.exports = {
  sessionIdProducer,
  isStaticResource
}
