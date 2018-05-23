(function (global) {
  'use strict'

  if (typeof Promise !== 'undefined') {
    return
  }


  //变量类型判断的工具方法
  function isType(type) {
    return function(obj) {
      return {}.toString.call(obj) == "[object " + type + "]"
    }
  }

  var isObject = isType("Object")
  var isString = isType("String")
  var isArray = Array.isArray || isType("Array")
  var isFunction = isType("Function")
  var STATUS = {
    PENDING: 'PENDING',
    FULFILLED: 'FULFILLED',
    REJECTED: 'REJECTED'
  }

  function Promise (func) {

    return this
  }

  //原型上的方法
  Promise.prototype.then = function () {

  }
  Promise.prototype.catch = function () {

  }

  //其他的方法
  Promise.resolve = function() {}
  Promise.reject = function() {}
  Promise.all = function() {}
  Promise.race = function() {}

  global.Promise = Promise
  module.exports = Promise
})(this)

