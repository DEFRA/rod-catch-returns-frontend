const { v4: uuid } = require('uuid')

const initialiseAnalyticsSessionData = async (request, h) => {
  if (!request.state.sid) {
    console.log('initialised AnalyticsSessionData')
    
    const id = uuid()
    request.cookieAuth.set({ sid: id })
    request.state.sid = { sid:id }
    //h.state('sid', { id })
    //request.auth.artifacts.sid = { sid: id }
    await request.cache().set({ unauth: true, gaClientId: request?.query?._ga })
  }
  //console.log(request.auth?.artifacts?.sid)
}

module.exports = {
  initialiseAnalyticsSessionData
}
