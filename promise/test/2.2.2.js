"use strict"

const assert = require("assert")
const {
  deferred,
  resolved,
  rejected
} = require("./adapter")
const { testFulfilled } = require('./testFunction')

const dummy = { dummy: "dummy" } // we fulfill or reject with this when we don't intend to test against it
const sentinel = { sentinel: "sentinel" } // a sentinel fulfillment value to test for with strict equality

describe("2.2.2: If `onFulfilled` is a function,", function () {
  describe("2.2.2.1: it must be called after `promise` is fulfilled, with `promise`’s fulfillment value as its " +
    "first argument.", function () {
      testFulfilled(sentinel, function (promise, done) {
        promise.then(function onFulfilled(value) {
          assert.strictEqual(value, sentinel)
          done()
        })
      })
    })

  describe("2.2.2.2: it must not be called before `promise` is fulfilled", function () {
    it("fulfilled after a delay", function (done) {
      var d = deferred()
      var isFulfilled = false

      d.promise.then(function onFulfilled() {
        assert.strictEqual(isFulfilled, true)
        done()
      })

      setTimeout(function () {
        d.resolve(dummy)
        isFulfilled = true
      }, 50)
    })

    it("never fulfilled", function (done) {
      var d = deferred()
      var onFulfilledCalled = false

      d.promise.then(function onFulfilled() {
        onFulfilledCalled = true
        done()
      })

      setTimeout(function () {
        assert.strictEqual(onFulfilledCalled, false)
        done()
      }, 150)
    })
  })

  describe("2.2.2.3: it must not be called more than once.", function () {
    it("already-fulfilled", function (done) {
      var timesCalled = 0

      resolved(dummy).then(function onFulfilled() {
        assert.strictEqual(++timesCalled, 1)
        done()
      })
    })

    it("trying to fulfill a pending promise more than once, immediately", function (done) {
      var d = deferred()
      var timesCalled = 0

      d.promise.then(function onFulfilled() {
        assert.strictEqual(++timesCalled, 1)
        done()
      })

      d.resolve(dummy)
      d.resolve(dummy)
    })

    it("trying to fulfill a pending promise more than once, delayed", function (done) {
      var d = deferred()
      var timesCalled = 0

      d.promise.then(function onFulfilled() {
        assert.strictEqual(++timesCalled, 1)
        done()
      })

      setTimeout(function () {
        d.resolve(dummy)
        d.resolve(dummy)
      }, 50)
    })

    it("trying to fulfill a pending promise more than once, immediately then delayed", function (done) {
      var d = deferred()
      var timesCalled = 0

      d.promise.then(function onFulfilled() {
        assert.strictEqual(++timesCalled, 1)
        done()
      })

      d.resolve(dummy)
      setTimeout(function () {
        d.resolve(dummy)
      }, 50)
    })

    it("when multiple `then` calls are made, spaced apart in time", function (done) {
      var d = deferred()
      var timesCalled = [0, 0, 0]

      d.promise.then(function onFulfilled() {
        assert.strictEqual(++timesCalled[0], 1)
      })

      setTimeout(function () {
        d.promise.then(function onFulfilled() {
          assert.strictEqual(++timesCalled[1], 1)
        })
      }, 50)

      setTimeout(function () {
        d.promise.then(function onFulfilled() {
          assert.strictEqual(++timesCalled[2], 1)
          done()
        })
      }, 100)

      setTimeout(function () {
        d.resolve(dummy)
      }, 150)
    })

    it("when `then` is interleaved with fulfillment", function (done) {
      var d = deferred()
      var timesCalled = [0, 0]

      d.promise.then(function onFulfilled() {
        assert.strictEqual(++timesCalled[0], 1)
      })

      d.resolve(dummy)

      d.promise.then(function onFulfilled() {
        assert.strictEqual(++timesCalled[1], 1)
        done()
      })
    })
  })
})
