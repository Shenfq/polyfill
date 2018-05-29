const assert = require("assert")
const Promise = require('../index.es5.js')

var nonFunction = null
var sentinel = {sentinel: 'sentinel'}
var sentinel2 = {sentinel2: 'sentinel2'}
var sentinel3 = {sentinel3: 'sentinel3'}
const dummy = { dummy: "dummy" } // we fulfill or reject with this when we don't intend to test against it
const other = { other: "other" } // a value we don't want to be strict equal to
/* var promise = Promise.resolve(sentinel).then(function () {
  return promise
})

promise.then(null, function (reason) {
  assert(reason instanceof TypeError)
}) */

/* var innerThenableFactory = thenables.fulfilled[innerStringRepresentation]

"a thenable that fulfills but then throws": function (value) {
  return {
    then: function (onFulfilled) {
      onFulfilled(value)
      throw other
    }
  }
},
"an asynchronously-fulfilled custom thenable": function (value) {
  return {
    then: function (onFulfilled) {
      setTimeout(function () {
        onFulfilled(value)
      }, 0)
    }
  }
},
"a synchronously-fulfilled one-time thenable": function (value) {
    var numberOfTimesThenRetrieved = 0
    return Object.create(null, {
      then: {
        get: function () {
          if (numberOfTimesThenRetrieved === 0) {
            ++numberOfTimesThenRetrieved
            return function (onFulfilled) {
              onFulfilled(value)
            }
          }
          return null
        }
      }
    })
  },

*/

function yFactory() {
  return {
    then: function (onFulfilled) {
      onFulfilled({
        then: function (onFulfilled) {
          setTimeout(function () {
            onFulfilled(sentinel)
          }, 0)
        }
      })
      throw other
    }
  }
}

function xFactory() {
  return {
    then: function (resolvePromise) {
      resolvePromise(yFactory())
    }
  }
}

var promise = Promise.resolve(dummy).then(function onBasePromiseFulfilled(value) {
  console.log(value)
  return xFactory()
})

promise.then(function onPromiseFulfilled(value) {
  console.log(value)
})
