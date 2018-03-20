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
      var onEnd = this.spans.length === 0 ? this.onEnd : null
      this.spans.push(new Span(data, onEnd))
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

  createTransaction() {
    return new Transaction(() => {
      this.reporter(transaction)
    })
  }

  findTransactionFor(span) {
    const entries = this.transactions.entries()
    for (let [ parentId, transaction ] of entries) {
      if (span.edges.has(parentId)) {
        return transaction
      }
    }
  }

  findOrCreateTransactionFor(span) {
    if (span.subType === 'start' && !span.edges.length) {
      return this.createTransaction()
    }
    return this.findTransactionFor(span)
  }

  send(span) {
    const transaction = this.findTransactionFor(span)
    transaction.add(span)
    this.transactions.set(span.id, transaction)
  }
}
