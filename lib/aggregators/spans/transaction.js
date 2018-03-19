class Span {
  constructor(start, onEnd) {
    this.start = start
    this.end = null
    this.annotations = []
    this.onEnd = onEnd
  }

  add(data) {
    if (data.subType === 'end') {
      this.end = data
      if (this.onEnd) {
        this.onEnd()
      }
    } else {
      this.annotations.push(data)
    }
  }
}

class Transaction {
  constructor(onEnd) {
    this.spans = []
    this.onEnd = onEnd
  }

  add(data) {
    if (data.subType === 'start') {
      var first = this.spans.length === 0
      this.spans.push(new Span(data, first && this.onEnd))
    } else {
      for (let span of this.spans) {
        if (data.edges.has(span.start.id)) {
          span.add(data)
        }
      }
    }
  }
}

module.exports = class TransactionAggregator {
  constructor(reporter) {
    this.transactions = new Map()
    this.reporter = reporter
  }

  findTransactionFor(span) {
    if (span.subType === 'start' && !span.edges.length) {
      const transaction = new Transaction(() => {
        this.reporter(transaction)
      })
      return transaction
    }

    for (let [ parentId, transaction ] of this.transactions.entries()) {
      if (span.edges.has(parentId)) {
        return transaction
      }
    }
  }

  send(span) {
    const transaction = this.findTransactionFor(span)
    transaction.add(span)
    this.transactions.set(span.id, transaction)
  }
}
