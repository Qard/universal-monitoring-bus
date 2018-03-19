const isSubset = require('is-subset')

class Watches extends Set {
  toJSON() {
    return Array.from(this)
  }
}

class Watch {
  constructor(monitor, query, handler) {
    this.query = query
    this.handle = handler

    Object.defineProperty(this, 'monitor', {
      value: monitor
    })
  }

  stop() {
    this.monitor.unwatch(this)
  }
}

class Monitor {
  constructor() {
    this.watches = new Watches()
  }

  unwatch(watch) {
    if (!(watch instanceof Watch)) {
      watch = this.findWatch(watch)
    }
    if (watch) {
      this.watches.delete(watch)
    }
  }

  watch(query, handler) {
    const watch = new Watch(this, query, handler)
    this.watches.add(watch)
    return watch
  }

  findWatch(query) {
    for (let watch of this.watches) {
      if (isSubset(query, watch.query)) {
        return watch
      }
    }
  }

  watching(query) {
    return !!this.findWatch(query)
  }

  send(data) {
    for (let watch of this.watches) {
      if (isSubset(data, watch.query)) {
        watch.handle(data)
      }
    }
  }
}

module.exports = new Monitor()
