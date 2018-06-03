'use strict'

const assert = require('assert')
const { Promise } = require("./adapter")


describe('extensions', function () {
  describe('Promise.all', function () {
    //https://github.com/domenic/promises-unwrapping/blob/master/reference-implementation/test/all.js
    it('fulfills if passed an empty array', function (done) {
      var iterable = []

      Promise.all(iterable).then(function (value) {
        assert(Array.isArray(value))
        assert.deepEqual(value, [])
        done()
      })
    })

    it('fulfills if passed an array of mixed fulfilled promises and values', function (done) {
      var iterable = [0, Promise.resolve(1), 2, Promise.resolve(3)]

      Promise.all(iterable).then(function (value) {
        assert(Array.isArray(value))
        assert.deepEqual(value, [0, 1, 2, 3])
        done()
      })
    })

    it('rejects if any passed promise is rejected', function (done) {
      var foreverPending = new Promise(function () { })
      var error = new Error('Rejected')
      var rejected = Promise.reject(error)

      var iterable = [foreverPending, rejected]

      Promise.all(iterable).then(
        function (value) {
          assert(false, 'should never get here')
          done()
        },
        function (reason) {
          assert.strictEqual(reason, error)
          done()
        }
      )
    })

    it('resolves foreign thenables', function (done) {
      var normal = Promise.resolve(1)
      var foreign = { then: function (f) { f(2) } }

      var iterable = [normal, foreign]

      Promise.all(iterable).then(function (value) {
        assert.deepEqual(value, [1, 2])
        done()
      })
    })

    it('does not reject twice', function (done) {
      var normal = Promise.resolve(1)
      var error = new Error('rejected once')
      var two = Promise.reject(error)
      var three = new Promise(function (resolve, reject) {
        setTimeout(function () {
          reject(new Error('rejected twice'))
        }, 30)
      })

      var iterable = [normal, two, three]

      Promise.all(iterable).then(function (value) {
        assert(false, 'should never get here')
        done()
      }, function (value) {
        assert.deepEqual(value, error)
        done()
      })
    })

    it('fulfills when passed an sparse array, giving `undefined` for the omitted values', function (done) {
      var iterable = [Promise.resolve(0), , , Promise.resolve(1)]

      Promise.all(iterable).then(function (value) {
        assert.deepEqual(value, [0, undefined, undefined, 1])
        done()
      })
    })

    it('does not modify the input array', function (done) {
      var input = [0, 1]
      var iterable = input

      Promise.all(iterable).then(function (value) {
        assert.notStrictEqual(input, value)
        done()
      })
    })


    it('should reject with a TypeError if given a non-iterable', function (done) {
      var notIterable = {}

      Promise.all(notIterable).then(
        function () {
          assert(false, 'should never get here')
          done()
        },
        function (reason) {
          assert(reason instanceof TypeError)
          done()
        }
      )
    })
  })
  describe('Promise.race', function () {
    //https://github.com/domenic/promises-unwrapping/blob/master/reference-implementation/test/all.js
    function delay(value, time, rejectIt) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (rejectIt) {
            return reject(value)
          }
          resolve(value)
        }, time)
      })
    }
    it('fulfills if passed an empty array', function (done) {
      var iterable = []

      Promise.race(iterable).then(function (value) {
        assert(Array.isArray(value))
        assert.deepEqual(value, [])
        done()
      })
    })

    it('fulfills if passed an array of mixed fulfilled promises and values', function (done) {
      var iterable = [delay(0, 20), Promise.resolve(1), delay(2, 30), delay(Promise.resolve(3), 20)]

      Promise.race(iterable).then(function (value) {
        assert.equal(value, 1)
        done()
      })
    })

    it('rejects if firsed resolved promise is rejected', function (done) {
      var error = new Error('Rejected')

      var iterable = [delay(true, 300), delay(error, 20, true)]

      Promise.race(iterable).then(
        function (value) {
          assert(false, 'should never get here')
          done()
        },
        function (reason) {
          assert.strictEqual(reason, error)
          done()
        }
      )
    })

    it('resolves if second resolved promise is rejected', function (done) {
      var error = new Error('Rejected')

      var iterable = [delay(true, 30), delay(error, 200, true)]

      Promise.race(iterable).then(
        function (value) {
          assert(value, 'should resolve')
          done()
        },
        function (reason) {
          assert(false, 'should never get here')
          done()
        }
      )
    })

    it('resolves foreign thenables', function (done) {
      var normal = Promise.resolve(1)
      var foreign = { then: function (f) { f(2) } }

      var iterable = [delay(Promise.resolve(1), 200), foreign]

      Promise.race(iterable).then(function (value) {
        assert.deepEqual(value, 2)
        done()
      })
    })

    it('fulfills when passed an sparse array, giving `undefined` for the omitted values', function (done) {
      var iterable = [delay(Promise.resolve(0), 300), , , delay(Promise.resolve(1), 300)]

      Promise.race(iterable).then(function (value) {
        assert.equal(value, undefined)
        done()
      })
    })

    it('should reject with a TypeError if given a non-iterable', function (done) {
      var notIterable = {}

      Promise.race(notIterable).then(
        function () {
          assert(false, 'should never get here')
          done()
        },
        function (reason) {
          assert(reason instanceof TypeError)
          done()
        }
      )
    })
  })
})
