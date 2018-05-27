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
var asynWrap = setTimeout
//基础变量的定义
var STATUS = {
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED'
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
      doResolve(self, value)
    })
  }
  function reject(reason) {
    if (called) return
    called = true
    asynWrap(function () {
      doReject(self, reason)
    })
  }

  try { //捕获执行resolver期间的异常
    resolver(resolve, reject)
  } catch (error) {
    asynWrap(function () {
      doReject(self, error)
    })
  }
}

//原型上的方法
Deferr.prototype.then = function doThen(onResolve, onReject) {
  var self = this
  if (this.status === STATUS.PENDING) {
    return new Deferr(function (resolve, reject) {
      self.resolveQueue.push(function (value) {
        try {
          //解决值穿透的问题，规范规定如果传入的不是函数，当前参数直接被忽略
          var returnValue = isFunction(onResolve) ? onResolve(value) : value
          if (returnValue instanceof Deferr) {
            returnValue.then(resolve, reject)
          }
          else {
            resolve(returnValue)
          }
        } catch (error) {
          reject(error)
        }
      })

      self.rejectQueue.push(function (reason) {
        try {
          //解决值穿透的问题，规范规定如果传入的不是函数，当前参数直接被忽略
          var returnValue = isFunction(onReject) ? onReject(reason) : reason
          if (returnValue instanceof Deferr) {
            returnValue.then(resolve, reject)
          }
          else {
            reject(returnValue)
          }
        } catch (error) {
          reject(error)
        }
      })
    })
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

function doResolve(self, value) {
  try {
    self.status = STATUS.FULFILLED
    self.value = value
    self.resolveQueue.forEach(function (func) {
      func(value)
    });
    return self
  } catch(error) {
    return doReject(self, error)
  }
}
function doReject(self, reason) {
  self.status = STATUS.REJECTED
  self.value = reason
  self.rejectQueue.forEach(function (func) {
    func(reason)
  })
  return self
}