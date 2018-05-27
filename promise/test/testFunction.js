"use strict";

const {
  deferred,
  resolved,
  rejected
} = require("./adapter")

module.exports = {
  testFulfilled: function (value, test) {
    it("already-fulfilled", function (done) {
      test(resolved(value), done)
    })

    it("immediately-fulfilled", function (done) {
      var d = deferred()
      test(d.promise, done)
      d.resolve(value)
    });

    it("eventually-fulfilled", function (done) {
      var d = deferred()
      test(d.promise, done)
      setTimeout(function () {
        d.resolve(value)
      }, 50)
    });
  },
  testRejected: function (reason, test) {
    it("already-rejected", function (done) {
      test(rejected(reason), done)
    });

    it("immediately-rejected", function (done) {
      var d = deferred()
      test(d.promise, done)
      d.reject(reason)
    });

    it("eventually-rejected", function (done) {
      var d = deferred()
      test(d.promise, done)
      setTimeout(function () {
        d.reject(reason)
      }, 50)
    });
  }
}