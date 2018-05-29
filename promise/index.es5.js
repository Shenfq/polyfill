'use strict'

if (typeof global.Deferr !== 'undefined') {
  return
}

module.exports = Deferr

//变量类型判断的工具方法
function getType (obj) {
  return {}.toString.call(obj)
}
function isType(type) {
  return function(obj) {
    return getType(obj) == "[object " + type + "]"
  }
}
var isObject = isType("Object")
var isString = isType("String")
var isArray = Array.isArray || isType("Array")
var isFunction = isType("Function")
//使用setTimeout将then内的方法变成异步调用
//TODO: 后续使用更合理的方式让promise异步化
var asynWrap = function (fn, self) {
  return function () {
    var args = [].slice.call(arguments)
    setTimeout(function () {
      fn.apply(self || this, args)
    })
  }
}
//基础变量的定义
var STATUS = {
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED'
}

var helper = {
  doResolve: function (promise, value) {
    try {
      promise.status = STATUS.FULFILLED
      promise.value = value
      promise.resolveQueue.forEach(function (func) {
        func(value)
      });
      return promise
    } catch(error) {
      return this.doReject(promise, error)
    }
  },
  doReject: function (promise, reason) {
    promise.status = STATUS.REJECTED
    promise.value = reason
    promise.rejectQueue.forEach(function (func) {
      func(reason)
    })
    return promise
  },
  doThenFunc: function (promise, status, returnValue, callbacks) {
    var resolve = callbacks.resolve, reject = callbacks.reject
    try {
      if (returnValue === promise) {
        throw new TypeError('Chaining cycle detected for promise')
      }
      if (returnValue instanceof Deferr) {
        returnValue.then(function (val) {
          helper.doThenFunc(promise, status, val, callbacks)
        }, reject)
        return
      }
      if (isObject(returnValue) || isFunction(returnValue)) {
        var then = returnValue.then, called = false //because x.then could be a getter
        if (isFunction(then)) {
          then.call(returnValue, function (val) {
            if (called) return //只能被调用一次
            called = true
            helper.doThenFunc(promise, status, val, callbacks)
          }, function (reason) {
            if (called) return //只能被调用一次
            called = true
            reject(reason)
          })
          return
        }
      }
      status === STATUS.FULFILLED
        ? resolve(returnValue)
        : reject(returnValue)
    } catch (error) {
      if (called) return //只能被调用一次
      called = true
      reject(error)
    }
  }
}

function Deferr(resolver) {
  if (!isFunction(resolver)) {
    throw new TypeError('Deferr resolver ' + getType(resolver) + ' is not a function')
  }
  this.status = STATUS.PENDING
  this.value = null
  this.resolveQueue = []
  this.rejectQueue = []

  var called = false //确保resolve和reject只会执行一次
  var self = this
  function resolve(value) {
    if (called) return
    called = true
    asynWrap(function () {
      helper.doResolve(self, value)
    })()
  }
  function reject(reason) {
    if (called) return
    called = true
    asynWrap(function () {
      helper.doReject(self, reason)
    })()
  }

  try { //捕获执行resolver期间的异常
    resolver(resolve, reject)
  } catch (error) {
    asynWrap(function () {
      helper.doReject(self, error)
    })()
  }
}

//原型上的方法
Deferr.prototype.then = function doThen(onResolve, onReject) {
  var self = this, newPormise
  //解决值穿透
  onReject = isFunction(onReject) ? onReject : function (reason) {throw reason}
  onResolve = isFunction(onResolve) ? onResolve : function (value) {return value}

  if (this.status === STATUS.PENDING) {
    return newPormise = new Deferr(function (resolve, reject) {
      self.resolveQueue.push(function (value) {
        try {
          var returnValue = onResolve(value)
          helper.doThenFunc(newPormise, STATUS.FULFILLED, returnValue, {resolve, reject})
        } catch (error) {
          reject(error)
        }
      })
      self.rejectQueue.push(function (reason) {
        try {
          var returnValue = onReject(reason)
          helper.doThenFunc(newPormise, STATUS.FULFILLED, returnValue, {resolve, reject})
        } catch (error) {
          reject(error)
        }
      })
    })
  }
  else {
    return newPormise = new Deferr(
      asynWrap(function (resolve, reject) {
        try {
          var returnValue = self.status === STATUS.FULFILLED
            ? onResolve(self.value)
            : onReject(self.value)

          helper.doThenFunc(newPormise, self.status, returnValue, {resolve, reject})
        } catch (error) {
          reject(error)
        }
      }, self)
    )
  }
}

Deferr.prototype.catch = function doCatch(onReject) {
  return this.then(null, onReject)
}

//其他的方法
Deferr.resolve = function (value) {
  return new this(function (resolve, reject) {
    resolve(value)
  })
}
Deferr.reject = function (reason) {
  return new this(function (resolve, reject) {
    reject(reason)
  })
}

Deferr.all = function () {

}
Deferr.race = function () {

}
