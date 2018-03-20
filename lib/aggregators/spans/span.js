class Span {
  constructor(start, onEnd) {
    this.start = null
    this.end = null
    this.annotations = []
    this._onEnd = onEnd
    if (start) this.add(start)
  }

  add(data) {
    switch (data.subType) {
      case 'start': {
        this.start = data
        break
      }
      case 'end': {
        this.end = data
        this._onEnd(this)
        break
      }
      case 'annotation': {
        this.annotations.push(data)
        break
      }
    }
  }
}

module.exports = class SpanAggregator {
  constructor(reporter) {
    this.spans = new Map()
    this.reporter = reporter
    this.onSpan = this.onSpan.bind(this)
  }

  onSpan(span) {
    this.spans.delete(span.start)
    this.spans.delete(span.end)
    span.annotations.forEach(annotation => {
      this.spans.delete(annotation)
    })
    this.reporter(span)
  }

  send(data) {
    if (data.subType === 'start') {
      var onEnd = this.spans.length === 0 ? this.onEnd : null
      var span = new Span(data, this.onSpan)
      this.spans.set(data.id, span)
    } else {
      for (let [ id, span ] of this.spans.entries()) {
        if (data.edges.has(id)) {
          span.add(data)
        }
      }
    }
  }
}
