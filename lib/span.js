const { format } = require('util')
const hrtime = require('convert-hrtime')
const Message = require('./message')

class Edges extends Set {
  toJSON() {
    return Array.from(this)
  }
}

class SpanMessage extends Message {
  constructor(subType, namespace, data) {
    super('span', namespace, data)
    this.subType = subType
    this.edges = new Edges()
    this.ts = null
  }

  link(parent) {
    this.edges.add(parent.id)
  }

  mark() {
    this.ts = hrtime(process.hrtime()).seconds
    this.send()
  }
}

class SpanStart extends SpanMessage {
  constructor(namespace, data) {
    super('start', namespace, data)
  }
}

class SpanEnd extends SpanMessage {
  constructor(namespace, data) {
    super('end', namespace, data)
  }
}

class SpanAnnotation extends SpanMessage {
  constructor(namespace, data) {
    super('annotation', namespace, data)
  }
}

module.exports = class Span {
  constructor(namespace, data) {
    this.namespace = namespace

    const start = new SpanStart(this.namespace, data)
    const end = new SpanEnd(this.namespace)
    end.link(start)

    Object.defineProperties(this, {
      $start: { value: start },
      $end: { value: end }
    })
  }

  start(parent, data) {
    if (parent) this.$start.link(parent)
    if (data) this.$start.set(data)
    this.$start.mark()
    return this.$start
  }

  end(parent, data) {
    if (!this.$start.ts) {
      throw new Error('span not yet started')
    }
    if (parent) this.$end.link(parent)
    if (data) this.$end.set(data)
    this.$end.mark()
    return this.$end
  }

  annotate(data) {
    const annotation = new SpanAnnotation(this.namespace, data)
    annotation.link(this.$start)
    annotation.mark()
    return annotation
  }

  log(...args) {
    return this.annotate({
      type: 'log',
      time: Date.now(),
      message: format(...args)
    })
  }
}
