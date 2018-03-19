const MovingAverage = require('moving-average')

function metricRecord([ key, metric ]){
  return {
    key,
    movingAverage: metric.movingAverage(),
    variance: metric.variance(),
    deviation: metric.deviation(),
    forecast: metric.forecast()
  }
}

module.exports = class MovingAverageMetricsAggregator {
  constructor(interval, handle) {
    this.metrics = new Map()
    this.timer = setInterval(() => {
      handle(Array.from(this.metrics.entries()).map(metricRecord))
    }, interval)
  }

  getMetric(name) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, MovingAverage(1000))
    }
    return this.metrics.get(name)
  }

  send(metric) {
    this.getMetric(metric.namespace).push(Date.now(), metric.value)
  }
}
