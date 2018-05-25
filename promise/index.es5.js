(function (global) {
  'use strict'

  if (typeof Promise !== 'undefined') {
    return
  }


  //变量类型判断的工具方法
  function getType (obj) {
    return {}.toString.call(obj)
  }
  function isType(type) {
    return function(obj) {
      return Type(obj) == "[object " + type + "]"
    }
  }
  var isObject = isType("Object")
  var isString = isType("String")
  var isArray = Array.isArray || isType("Array")
  var isFunction = isType("Function")
  var asynWrap = setTimeout //使用setTimeout将then内的方法变成异步调用
  //基础变量的定义
  var STATUS = {
    PENDING: 'PENDING',
    FULFILLED: 'FULFILLED',
    REJECTED: 'REJECTED'
  }
  //定义一个空函数，用来在then中创建新的promise时使用
  function noop() {}

  function Promise(resolver) {
    if (!isFunction(resolver)) {
      throw new TypeError('Promise resolver ' + getType(resolver) + ' is not a function')
    }
    this.state = STATUS.PENDING
    this.value = null
    this.resolveQueue = []
    this.rejectQueue = []

    var called = false //确保resolve和reject只会执行一次

    function resolve(value) {
      if (called) return
      called = true
      asynWrap(
        doResolve(this, value)
      )
    }
    function reject(reason) {
      if (called) return
      called = true
      asynWrap(
        doReject(this, reason)
      )
    }

    if (resolver !== noop) {
      try { //捕获执行resolver期间的异常
        resolver(resolve.bind(this), reject(this))
      } catch (error) {
        asynWrap(
          doReject(this, error)
        )
      }
    }
  }

  //原型上的方法
  Promise.prototype.then = function doThen(onResolve, onReject) {
    if (
      (this.state === STATUS.FULFILLED && !isFunction(onResolve))
      || (this.state === STATUS.REJECTED && !isFunction(onReject))
    ) { //解决值穿透的问题
      return this
    }
    var returned = new Promise(noop)
    
  }

  Promise.prototype.catch = function doCatch(onReject) {
    return this.then(null, onReject)
  }

  //其他的方法
  Promise.resolve = function () { }
  Promise.reject = function () { }
  Promise.all = function () { }
  Promise.race = function () { }

  function doResolve(self, value) {
    self.state = STATUS.FULFILLED
  }
  function doReject(self, value) {
    self.state = STATUS.REJECTED
  }
  global.Promise = Promise
  module.exports = Promise
})(this)

