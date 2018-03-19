const monitor = require('./monitor')
const uuid = require('uuid/v4')

module.exports = class Message {
  constructor(type, namespace, data) {
    this.id = uuid()
    this.type = type
    this.namespace = namespace
    this.data = data
  }

  set(data) {
    Object.assign(this.data, data)
  }

  send() {
    monitor.send(this)
  }
}
