const { monitor, Span, Metric, PullMetric } = require('./')
const TransactionAggregator = require('./lib/aggregators/spans/transaction')


//
// Test watchers
//
const watch = monitor.watch({
  type: 'span',
  namespace: 'test',
  data: { foo: 'bar' }
})

const span = new Span('test', { foo: 'bar' })
console.log('is watching', span, monitor.watching(span))

watch.stop()
console.log('is watching', span, monitor.watching(span))


//
// Pull-based metric collectors
//
const rss = new PullMetric('rss', null, 1000, () => {
  return process.memoryUsage().rss
})
const heapTotal = new PullMetric('heap-total', null, 1000, () => {
  return process.memoryUsage().heapTotal
})
const heapUsed = new PullMetric('heap-used', null, 1000, () => {
  return process.memoryUsage().heapUsed
})

//
// Spans
//
const transactions = new TransactionAggregator(transaction => {
  console.log('done', JSON.stringify(transaction, null, 2))
})
monitor.watch({ type: 'span' }, span => {
  transactions.send(span)
})

async function makeSpan() {
  let span
  if (monitor.watching({ type: 'span', namespace: 'some-span' })) {
    span = new Span('some-span', {
      data: 'here'
    })
    span.start()
  }

  await delay(randScale(1000))

  if (span) {
    for (let n = 0; n < 5; n++) {
      span.log(`message #${n}`)
      await delay(randScale(100))
    }
    span.annotate({ foo: 'bar' })
  }

  await delay(randScale(1000))

  if (span) span.end()
}

Promise.all(parallel(5, trackActive('active-requests', makeSpan))).then(
  value => console.log({ value }),
  error => console.error(error.stack)
)

//
// Some helpers
//
function randScale(scale) {
  return Math.floor(Math.random() * scale)
}

function delay(ms) {
  return new Promise(pass => setTimeout(pass, ms))
}

function* range(b, a = 0) {
  while (a < b) yield a++
}

function trackActive(name, fn) {
  const counter = new Metric(name)
  return async function tracked() {
    counter.incr()
    const ret = await fn()
    counter.decr()
    return ret
  }
}

function repeat(ms, fn) {
  return async function repeated() {
    while (true) {
      await fn()
      await delay(ms)
    }
  }
}

function parallel(n, fn) {
  return Array.from(range(n)).map(fn)
}
