const Message = require('./message')

module.exports = class PullMetric extends Message {
  constructor(namespace, data, interval, puller) {
    super('metric', namespace, data)
    this.interval = interval
    this.puller = puller
    this.value = 0
    this.start()
  }

  start() {
    this.stop()
    this.timer = setInterval(() => {
      this.value = this.puller()
      this.send()
    }, this.interval)
  }

  stop() {
    clearInterval(this.timer)
  }
}
