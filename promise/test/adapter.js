// const Promise = require('../index.es5.js')
const Promise = require('../index.es6.js')

let adapter = {}

adapter.deferred = function () {
  var pending = {};
  pending.promise = new Promise(function (resolver, reject) {
    pending.resolve = resolver;
    pending.reject = reject;
  });
  return pending;
}
adapter.resolved = function (value) {
  return Promise.resolve(value);
}
adapter.rejected = function (reason) {
  return Promise.reject(reason);
}
adapter.Promise = Promise

module.exports = adapter
