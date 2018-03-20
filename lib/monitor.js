const assert = require('assert')
const isSubset = require('is-subset')

class Watches extends Set {
  toJSON() {
    return Array.from(this)
  }
}

class Watch {
  constructor(monitor, query, handler) {
    assert(typeof query === 'object', 'no watch query')
    assert(typeof handler === 'function', 'no watch handler')
    this.query = query
    this.handle = handler

    Object.defineProperty(this, 'monitor', {
      value: monitor
    })
  }

  matches(query) {
    return isSubset(query, this.query)
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
      if (watch.matches(query)) {
        return watch
      }
    }
  }

  watching(query) {
    return !!this.findWatch(query)
  }

  send(data) {
    for (let watch of this.watches) {
      if (watch.matches(data)) {
        watch.handle(data)
      }
    }
  }
}

module.exports = new Monitor()
