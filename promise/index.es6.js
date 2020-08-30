'use strict'

if (typeof global.Deferred !== 'undefined') {
  return
}

//基础变量的定义
const STATUS = {
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED'
}

//工具方法
const helper = {
  //使用setTimeout将then内的方法变成异步调用
  //TODO: 后续使用更合理的方式让promise异步化
  asynWrap(fn, ...args) {
    setTimeout(function () {
      fn(...args)
    }, 4)
  },
  getType(obj) {
    return {}.toString.call(obj)
  },
  isArray: Array.isArray,
  isFunction(obj) {
    return this.getType(obj) === "[object Function]"
  },
  isObject(obj) {
    return this.getType(obj) === "[object Object]"
  },
  doResolve(promise, value) {
    try {
      promise.status = STATUS.FULFILLED
      promise.value = value
      promise.resolveQueue.forEach(function (func) {
        func(value)
      })
      return promise
    } catch (error) {
      return this.doReject(promise, error)
    }
  },
  doReject(promise, reason) {
    promise.status = STATUS.REJECTED
    promise.value = reason
    promise.rejectQueue.forEach(function (func) {
      func(reason)
    })
    return promise
  },
  doThenFunc(promise, returnValue, callbacks) {
    let resolve = callbacks.resolve, reject = callbacks.reject
    let called = false
    try {
      if (returnValue === promise) {
        throw new TypeError('Chaining cycle detected for promise')
      }
      if (returnValue instanceof Deferred) {
        returnValue.then(function (val) {
          helper.doThenFunc(promise, val, callbacks)
        }, reject)
        return
      }
      if (helper.isObject(returnValue) || helper.isFunction(returnValue)) {
        let then = returnValue.then //because x.then could be a getter
        if (helper.isFunction(then)) {
          then.call(returnValue, function (val) {
            if (called) return //只能被调用一次
            called = true
            helper.doThenFunc(promise, val, callbacks)
          }, function (reason) {
            if (called) return //只能被调用一次
            called = true
            reject(reason)
          })
          return
        }
      }
      resolve(returnValue)
    } catch (error) {
      if (called) return //只能被调用一次
      called = true
      reject(error)
    }
  }
}

class Deferred {
  constructor(resolver) {
    if (!helper.isFunction(resolver)) {
      throw new TypeError('Deferred resolver ' + helper.getType(resolver) + ' is not a function')
    }

    this.status = STATUS.PENDING
    this.value = null
    this.resolveQueue = []
    this.rejectQueue = []

    let called = false //确保resolve和reject只会执行一次

    try { //捕获执行resolver期间的异常
      resolver(
        value => {
          if (called) return
          called = true
          helper.asynWrap(() => {
            helper.doResolve(this, value)
          })
        },
        reason => {
          if (called) return
          called = true
          helper.asynWrap(() => {
            helper.doReject(this, reason)
          })
        }
      )
    } catch (error) {
      helper.asynWrap(() => {
        helper.doReject(this, error)
      })
    }
  }

  then(onResolve, onReject) {
    let newPormise
    //解决值穿透
    onReject = helper.isFunction(onReject) ? onReject : function (reason) { throw reason }
    onResolve = helper.isFunction(onResolve) ? onResolve : function (value) { return value }

    if (this.status === STATUS.PENDING) {
      return newPormise = new Deferred((resolve, reject) => {
        this.resolveQueue.push(function (value) {
          try {
            let returnValue = onResolve(value)
            helper.doThenFunc(newPormise, returnValue, {
              resolve, reject
            })
          } catch (error) {
            reject(error)
          }
        })
        this.rejectQueue.push(function (reason) {
          try {
            let returnValue = onReject(reason)
            helper.doThenFunc(newPormise, returnValue, {
              resolve, reject
            })
          } catch (error) {
            reject(error)
          }
        })
      })
    } else {
      return newPormise = new Deferred((resolve, reject) => {
        helper.asynWrap(() => {
          try {
            let returnValue = this.status === STATUS.FULFILLED
              ? onResolve(this.value)
              : onReject(this.value)

            helper.doThenFunc(newPormise, returnValue, {
              resolve, reject
            })
          } catch (error) {
            reject(error)
          }
        }, resolve, reject)
      })
    }
  }

  catch(onReject) {
    return this.then(null, onReject)
  }

  //其他的静态方法

  static resolve(value) {
    return new this(function (resolve, reject) {
      resolve(value)
    })
  }

  static reject(reason) {
    return new this(function (resolve, reject) {
      reject(reason)
    })
  }

  static all(promises) {
    if (!helper.isArray(promises)) {
      return this.reject(new TypeError('args must be an array'))
    }

    let newPromise, remaining = 1, result = []
    const len = promises.length

    return newPromise = new Deferred(function (resolve, reject) {
      if (promises.length === 0) return resolve([])

      helper.asynWrap(() => {
        for (let i = 0; i < len; i++) {
          done(i, promises[i])
        }
      })

      function done(index, value) {
        helper.doThenFunc(newPromise, value, {
          resolve: (val) => {
            result[index] = val
            if (++remaining === len) {
              resolve(result)
            }
          },
          reject
        })
      }
    })

  }

  static race(promises) {
    if (!helper.isArray(promises)) {
      return this.reject(new TypeError('args must be an array'))
    }
    let newPromise
    const len = promises.length

    return newPromise = new Deferred(function (resolve, reject) {
      if (promises.length === 0) return resolve([])

      helper.asynWrap(() => {
        for (let i = 0; i < len; i++) {
          done(i, promises[i])
        }
      })
      function done(index, value) {
        helper.doThenFunc(newPromise, value, {
          resolve, reject
        })
      }
    })
  }
}

module.exports = Deferred
