const hrtime = require('convert-hrtime')
const Message = require('./message')

class Edges extends Set {
  toJSON() {
    return Array.from(this)
  }
}

class SpanNode extends Message {
  constructor(type, subType, namespace, data) {
    super(type, namespace, data)
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

class SpanStart extends SpanNode {
  constructor(namespace, data) {
    super('span', 'start', namespace, data)
  }
}

class SpanEnd extends SpanNode {
  constructor(namespace, data) {
    super('span', 'end', namespace, data)
  }
}

class SpanAnnotation extends SpanNode {
  constructor(namespace, data) {
    super('span', 'annotation', namespace, data)
  }
}

module.exports = class Span extends Message {
  constructor(namespace, data) {
    super('span', namespace, data)

    const start = new SpanStart(this.namespace, data)
    const end = new SpanEnd(this.namespace)
    end.link(start)

    this.last = null

    Object.defineProperties(this, {
      $start: { value: start },
      $end: { value: end }
    })
  }

  start(parent, data) {
    if (parent) this.$start.link(parent)
    if (data) this.$start.set(data)
    this.$start.mark()
    this.last = this.$start
  }

  end(parent, data) {
    if (!this.$start.ts) {
      throw new Error('span not yet started')
    }
    if (parent) this.$end.link(parent)
    if (data) this.$end.set(data)
    this.$end.link(this.last)
    this.$end.mark()
    this.last = this.$end
  }

  annotate(data) {
    const annotation = new SpanAnnotation(this.namespace, data)
    annotation.link(this.$start)
    annotation.link(this.last)
    annotation.mark()
    this.last = annotation
  }

  log(message) {
    this.annotate({
      type: 'log',
      time: Date.now(),
      message
    })
  }
}
