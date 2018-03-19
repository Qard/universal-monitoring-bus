const Message = require('./message')

module.exports = class Metric extends Message {
  constructor(namespace, data) {
    super('metric', namespace, data)
    this.value = 0
  }

  incr() {
    this.value++
    this.send()
  }

  decr() {
    this.value--
    this.send()
  }

  mark(value) {
    this.value = value
    this.send()
  }
}
