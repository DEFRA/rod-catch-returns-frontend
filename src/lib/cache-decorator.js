'use strict'

/*
 * Decorators to make access to the session cache available as
 * simple setters and getters hiding the session key.
 */

module.exports = function () {
  return {
    getId: () => this.auth?.artifacts?.sid,
    get: async () => {
      try {
        console.log(this.state)
        //console.log(this.auth.artifacts.sid)
        const result = await this.server.app.cache.get(this.state.sid.sid)
        return result
      } catch (err) {
        console.log(err)
        throw new Error('Cache fetch error')
      }
    },
    set: async (obj) => {
      try {
        await this.server.app.cache.set(this.state.sid.sid, obj)
      } catch (err) {
        throw new Error('Cache put error')
      }
    },
    drop: async () => {
      try {
        await this.server.app.cache.drop(this.state.sid.sid)
      } catch (err) {
        throw new Error('Cache drop error')
      }
    }
  }
}
