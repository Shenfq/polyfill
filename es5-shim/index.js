// 使用 umd 的方式进行扩展
(function (root, factory) {
  'use strict'

  if (typeof define === 'function' && define.amd) {
    // AMD 的方式定义模块
    define(factory);
  } else if (typeof exports === 'object') {
    // commonjs 的方式定义模块
    module.exports = factory();
  } else {
    // 直接挂载到全局对象
    root.returnExports = factory();
  }
})(this, function () {
  // 获取基础类型的原型
  var ArrayProto = Array.prototype;
  var ObjectProto = Object.prototype;
  var FunctionProto = Function.prototype;
  var StringProto = String.prototype;
  var NumberProto = Number.prototype;

  // 获取一些常用方法
  var array_slice = ArrayProto.slice;
  var array_splice = ArrayProto.splice;
  var array_push = ArrayProto.push;
  var array_unshift = ArrayProto.unshift;
  var array_concat = ArrayProto.concat;
  var array_join = ArrayProto.join;
  var max = Math.max;
  var min = Math.min;
  var to_string = ObjectProto.toString;
  var call = FunctionProto.call;
  var apply = FunctionProto.apply;
  var owns = call.bind(ObjectProto.hasOwnProperty);
  var toStr = call.bind(ObjectProto.toString);
  var arraySlice = call.bind(array_slice);
  var arraySliceApply = apply.bind(array_slice);


  var isCallable = function isCallable(value) {
    if (!value) { return false; }
    if (typeof value !== 'function' && typeof value !== 'object') { return false; }
    var strClass = to_string.call(value);
    return strClass === '[object Function]';
  };


  var defineProperties = (function (has) {
    var defineProperty = function (object, name, method) {
      // 如果已经存在则不进行覆写
      // if (name in object) {
      //   return;
      // }
      object[name] = method;
    };
    return function defineProperties(object, map) {
      for (var name in map) {
        if (has.call(map, name)) {
          defineProperty(object, name, map[name]);
        }
      }
    };
  }(ObjectProto.hasOwnProperty));

  defineProperties(FunctionProto, {
    bind: function bind(that) {
      // 1. 获取当前调用 bind 方法的对象
      var target = this
      // 2. 判断调用的 bind 方法的对象是否可被调用（既是否为一个『真的』函数）
      if (!isCallable(target)) {
        // 不可调用抛出类型错误的异常
        throw new TypeError('Function.prototype.bind called on incompatible ' + target)
      }
      // bind 方法除了第一个参数会进行 this 绑定，
      // 其余的参数会进行柯里化（curring）
      var args = array_slice.call(arguments, 1)
      var bound
      var binder = function () {
        // bind 绑定 this 的优先级低于 new
        // 如果当前 this 对象是 bound 的实例，表示是 new 操作
        if (this instanceof bound) {
          var result = apply.call(
            target,
            this,
            // 将 bind 方法的剩余参数与返回方法调用时的参数进行拼接
            array_concat.call(args, array_slice.call(arguments))
          );
          if (Object(result) === result) {
            return result
          }
          return this
        }
        // 如果是普通调用，使用 call 进行 this 绑定
        else {
          return apply.call(
            target,
            that,
            // 将 bind 方法的剩余参数与返回方法调用时的参数进行拼接
            array_concat.call(args, array_slice.call(arguments))
          )
        }
      }
      var boundLength = max(0, target.length - args.length)
      var boundArgs = []

      // 进行函数参数模拟
      // function ($0, $1, $2) {}
      for (var i = 0; i < boundLength; i++) {
        array_push.call(boundArgs, '$' + i)
      }

      // 这样构造函数的目的是为了模拟函数的 length 属性
      bound = Function(
        'binder',
        'return function (' + array_join.call(boundArgs, ',') + '){ return binder.apply(this, arguments); }'
      )(binder)

      var Empty = function Empty() { }

      // 还原函数的原型链
      if (target.prototype) {
        Empty.prototype = target.prototype
        bound.prototype = new Empty()
        // 清除原型的引用
        Empty.prototype = null
      }

      return bound
    }
  })

  var isArray = function isArray(obj) {
    return toStr(obj) === '[object Array]'
  }

  defineProperties(Array, { isArray: isArray })

  defineProperties(ArrayProto, {
    forEach: function forEach(callback/*, thisArg*/) {
      var self = Object(this)
      var length = self.length
      var i = -1
      var thisArg = arguments.length > 1 ? arguments[1] : undefined

      if (!isCallable(callback)) {
        throw new TypeError('Array.prototype.forEach callback must be a function')
      }

      while (++i < length) {
        if (i in self) {
          if (typeof thisArg === 'undefined') {
            callback(self[i], i, object)
          } else {
            callbackfn.call(thisArg, self[i], i, object)
          }
        }
      }
    },
    map: function map(callback/*, thisArg*/) {
      var self = Object(this)
      var length = self.length
      var result = Array(length)
      var thisArg = arguments.length > 1 ? arguments[1] : undefined

      if (!isCallable(callback)) {
        throw new TypeError('Array.prototype.map callback must be a function')
      }

      for (var i = 0; i < length; i++) {
        if (i in self) {
          if (typeof thisArg === 'undefined') {
            result[i] = callback(self[i], i, object)
          } else {
            result[i] = callback.call(thisArg, self[i], i, object)
          }
        }
      }
      return result
    },
  })
})