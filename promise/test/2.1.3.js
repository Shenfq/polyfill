"use strict";

var assert = require("assert")

const {
  deferred,
  resolved,
  rejected
} = require("./adapter")
const { testRejected } = require('./testFunction')

const dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it

describe("2.1.3.1: When rejected, a promise: must not transition to any other state.", function () {
  testRejected(dummy, function(promise, done) {
    var onRejectedCalled = false

    promise.then(function onFulfilled() {
      assert.strictEqual(onRejectedCalled, false);
      done()
    }, function onRejected() {
      onRejectedCalled = true
    });

    setTimeout(done, 100)
  })

  it("trying to reject then immediately fulfill", function (done) {
    var d = deferred()
    var onRejectedCalled = false

    d.promise.then(function onFulfilled() {
      assert.strictEqual(onRejectedCalled, false)
      done();
    }, function onRejected() {
      onRejectedCalled = true
    });

    d.reject(dummy)
    d.resolve(dummy)
    setTimeout(done, 100)
  });

  it("trying to reject then fulfill, delayed", function (done) {
    var d = deferred()
    var onRejectedCalled = false

    d.promise.then(function onFulfilled() {
      assert.strictEqual(onRejectedCalled, false)
      done();
    }, function onRejected() {
      onRejectedCalled = true
    });

    setTimeout(function () {
      d.reject(dummy)
      d.resolve(dummy)
    }, 50)
    setTimeout(done, 100)
  });

  it("trying to reject immediately then fulfill delayed", function (done) {
    var d = deferred()
    var onRejectedCalled = false

    d.promise.then(function onFulfilled() {
      assert.strictEqual(onRejectedCalled, false)
      done()
    }, function onRejected() {
      onRejectedCalled = true
    })

    d.reject(dummy)
    setTimeout(function () {
      d.resolve(dummy)
    }, 50)
    setTimeout(done, 100)
  });
});
