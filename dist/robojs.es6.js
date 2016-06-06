!function(e){function r(e,r,o){return 4===arguments.length?t.apply(this,arguments):void n(e,{declarative:!0,deps:r,declare:o})}function t(e,r,t,o){n(e,{declarative:!1,deps:r,executingRequire:t,execute:o})}function n(e,r){r.name=e,e in p||(p[e]=r),r.normalizedDeps=r.deps}function o(e,r){if(r[e.groupIndex]=r[e.groupIndex]||[],-1==v.call(r[e.groupIndex],e)){r[e.groupIndex].push(e);for(var t=0,n=e.normalizedDeps.length;n>t;t++){var a=e.normalizedDeps[t],u=p[a];if(u&&!u.evaluated){var d=e.groupIndex+(u.declarative!=e.declarative);if(void 0===u.groupIndex||u.groupIndex<d){if(void 0!==u.groupIndex&&(r[u.groupIndex].splice(v.call(r[u.groupIndex],u),1),0==r[u.groupIndex].length))throw new TypeError("Mixed dependency cycle detected");u.groupIndex=d}o(u,r)}}}}function a(e){var r=p[e];r.groupIndex=0;var t=[];o(r,t);for(var n=!!r.declarative==t.length%2,a=t.length-1;a>=0;a--){for(var u=t[a],i=0;i<u.length;i++){var s=u[i];n?d(s):l(s)}n=!n}}function u(e){return x[e]||(x[e]={name:e,dependencies:[],exports:{},importers:[]})}function d(r){if(!r.module){var t=r.module=u(r.name),n=r.module.exports,o=r.declare.call(e,function(e,r){if(t.locked=!0,"object"==typeof e)for(var o in e)n[o]=e[o];else n[e]=r;for(var a=0,u=t.importers.length;u>a;a++){var d=t.importers[a];if(!d.locked)for(var i=0;i<d.dependencies.length;++i)d.dependencies[i]===t&&d.setters[i](n)}return t.locked=!1,r},r.name);t.setters=o.setters,t.execute=o.execute;for(var a=0,i=r.normalizedDeps.length;i>a;a++){var l,s=r.normalizedDeps[a],c=p[s],v=x[s];v?l=v.exports:c&&!c.declarative?l=c.esModule:c?(d(c),v=c.module,l=v.exports):l=f(s),v&&v.importers?(v.importers.push(t),t.dependencies.push(v)):t.dependencies.push(null),t.setters[a]&&t.setters[a](l)}}}function i(e){var r,t=p[e];if(t)t.declarative?c(e,[]):t.evaluated||l(t),r=t.module.exports;else if(r=f(e),!r)throw new Error("Unable to load dependency "+e+".");return(!t||t.declarative)&&r&&r.__useDefault?r["default"]:r}function l(r){if(!r.module){var t={},n=r.module={exports:t,id:r.name};if(!r.executingRequire)for(var o=0,a=r.normalizedDeps.length;a>o;o++){var u=r.normalizedDeps[o],d=p[u];d&&l(d)}r.evaluated=!0;var c=r.execute.call(e,function(e){for(var t=0,n=r.deps.length;n>t;t++)if(r.deps[t]==e)return i(r.normalizedDeps[t]);throw new TypeError("Module "+e+" not declared as a dependency.")},t,n);c&&(n.exports=c),t=n.exports,t&&t.__esModule?r.esModule=t:r.esModule=s(t)}}function s(r){if(r===e)return r;var t={};if("object"==typeof r||"function"==typeof r)if(g){var n;for(var o in r)(n=Object.getOwnPropertyDescriptor(r,o))&&h(t,o,n)}else{var a=r&&r.hasOwnProperty;for(var o in r)(!a||r.hasOwnProperty(o))&&(t[o]=r[o])}return t["default"]=r,h(t,"__useDefault",{value:!0}),t}function c(r,t){var n=p[r];if(n&&!n.evaluated&&n.declarative){t.push(r);for(var o=0,a=n.normalizedDeps.length;a>o;o++){var u=n.normalizedDeps[o];-1==v.call(t,u)&&(p[u]?c(u,t):f(u))}n.evaluated||(n.evaluated=!0,n.module.execute.call(e))}}function f(e){if(D[e])return D[e];if("@node/"==e.substr(0,6))return y(e.substr(6));var r=p[e];if(!r)throw"Module "+e+" not present.";return a(e),c(e,[]),p[e]=void 0,r.declarative&&h(r.module.exports,"__esModule",{value:!0}),D[e]=r.declarative?r.module.exports:r.esModule}var p={},v=Array.prototype.indexOf||function(e){for(var r=0,t=this.length;t>r;r++)if(this[r]===e)return r;return-1},g=!0;try{Object.getOwnPropertyDescriptor({a:0},"a")}catch(m){g=!1}var h;!function(){try{Object.defineProperty({},"a",{})&&(h=Object.defineProperty)}catch(e){h=function(e,r,t){try{e[r]=t.value||t.get.call(e)}catch(n){}}}}();var x={},y="undefined"!=typeof System&&System._nodeRequire||"undefined"!=typeof require&&require.resolve&&"undefined"!=typeof process&&require,D={"@empty":{}};return function(e,n,o){return function(a){a(function(a){for(var u={_nodeRequire:y,register:r,registerDynamic:t,get:f,set:function(e,r){D[e]=r},newModule:function(e){return e}},d=0;d<n.length;d++)(function(e,r){r&&r.__esModule?D[e]=r:D[e]=s(r)})(n[d],arguments[d]);o(u);var i=f(e[0]);if(e.length>1)for(var d=1;d<e.length;d++)f(e[d]);return i.__useDefault?i["default"]:i})}}}("undefined"!=typeof self?self:global)

(["1"], [], function($__System) {

$__System.register("2", [], function($__export) {
  "use strict";
  return {
    setters: [],
    execute: function() {
      $__export('default', Object.freeze({load: function(id) {
          return new Promise(function(resolve, reject) {
            return window.require([id], resolve, reject);
          });
        }}));
    }
  };
});

$__System.register("3", ["4"], function($__export) {
  "use strict";
  var EventDispatcher;
  return {
    setters: [function($__m) {
      EventDispatcher = $__m.default;
    }],
    execute: function() {
      $__export('default', function() {
        var REGISTERED_ELEMENTS = {};
        function create(id) {
          return function(Mediator) {
            var customProto = Mediator();
            var proto = Object.assign(Object.create(HTMLElement.prototype), customProto, {dispatcher: EventDispatcher});
            document.registerElement(id, {prototype: proto});
            return true;
          };
        }
        function findMediators(definitions, loader) {
          return function(node) {
            var id = node.tagName.toLowerCase();
            if (REGISTERED_ELEMENTS[id]) {
              return Promise.resolve(true);
            } else {
              REGISTERED_ELEMENTS[id] = true;
              return loader.load(definitions[id]).then(create(id));
            }
          };
        }
        function hasMediator(definitions) {
          return function(node) {
            var id = node.tagName.toLowerCase();
            return (definitions[id] && !REGISTERED_ELEMENTS[id]);
          };
        }
        var KE = ["abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "command", "datalist", "dd", "del", "details", "dfn", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "map", "mark", "menu", "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "u", "ul", "var", "video", "wbr"];
        var query = KE.map(function(e) {
          return ":not(" + e + ")";
        }).reduce(function(prev, curr) {
          return prev + curr;
        }, "*");
        function getAllElements(node) {
          return [node].concat([].slice.call(node.querySelectorAll(query), 0));
        }
        return Object.freeze({
          destroy: function(_) {
            return true;
          },
          findMediators: findMediators,
          hasMediator: hasMediator,
          getAllElements: getAllElements
        });
      });
      ;
    }
  };
});

$__System.registerDynamic("5", ["6", "7"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _checkForMethod = $__require('6');
  var _curry2 = $__require('7');
  module.exports = _curry2(_checkForMethod('forEach', function forEach(fn, list) {
    var len = list.length;
    var idx = 0;
    while (idx < len) {
      fn(list[idx]);
      idx += 1;
    }
    return list;
  }));
  return module.exports;
});

$__System.register("8", ["9", "5", "a", "b", "c"], function($__export) {
  "use strict";
  var map,
      forEach,
      flatten,
      compose,
      filter;
  return {
    setters: [function($__m) {
      map = $__m.default;
    }, function($__m) {
      forEach = $__m.default;
    }, function($__m) {
      flatten = $__m.default;
    }, function($__m) {
      compose = $__m.default;
    }, function($__m) {
      filter = $__m.default;
    }],
    execute: function() {
      $__export('default', function(DomWatcher, loader, handler, definitions) {
        var domWatcher = DomWatcher(handler.getAllElements);
        var _handleNodesRemoved = compose(forEach(handler.destroy), flatten);
        var getMediators = compose(function(promises) {
          return Promise.all(promises);
        }, map(handler.findMediators(definitions, loader)), filter(handler.hasMediator(definitions)), flatten);
        domWatcher.onAdded.connect(getMediators);
        domWatcher.onRemoved.connect(_handleNodesRemoved);
        var bootstrap = compose(getMediators, map(handler.getAllElements), function() {
          var root = arguments[0] !== (void 0) ? arguments[0] : document.body;
          return [root];
        });
        return Object.freeze({bootstrap: bootstrap});
      });
    }
  };
});

$__System.register("d", [], function($__export) {
  "use strict";
  function Signal() {
    var listenerBoxes = [];
    function registerListener(listener, scope, once) {
      listenerBoxes.filter(function(box) {
        return (box.listener === listener && box.scope === scope) && (function(box) {
          return (box.once && !once) || (once && !box.once);
        });
      }).forEach(function(_) {
        throw new Error('You cannot addOnce() then try to add() the same listener without removing the relationship first.');
      });
      listenerBoxes = listenerBoxes.concat([{
        listener: listener,
        scope: scope,
        once: once
      }]);
    }
    function emit() {
      var args = arguments;
      listenerBoxes.forEach(function($__1) {
        var $__2 = $__1,
            listener = $__2.listener,
            scope = $__2.scope,
            once = $__2.once;
        once && disconnect(listener, scope);
        listener.apply(scope, args);
      });
    }
    var connect = function(slot, scope) {
      return registerListener(slot, scope, false);
    };
    var connectOnce = function(slot, scope) {
      return registerListener(slot, scope, true);
    };
    function disconnect(slot, _scope) {
      listenerBoxes = listenerBoxes.filter(function($__1) {
        var $__2 = $__1,
            listener = $__2.listener,
            scope = $__2.scope;
        return listener !== slot && scope !== _scope;
      });
    }
    function disconnectAll() {
      listenerBoxes.forEach(function($__1) {
        var $__2 = $__1,
            listener = $__2.listener,
            scope = $__2.scope;
        return disconnect(listener, scope);
      });
    }
    return Object.freeze({
      connect: connect,
      connectOnce: connectOnce,
      disconnect: disconnect,
      disconnectAll: disconnectAll,
      emit: emit
    });
  }
  $__export("default", Signal);
  return {
    setters: [],
    execute: function() {}
  };
});

$__System.registerDynamic("e", ["f"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var isArrayLike = $__require('f');
  module.exports = function _makeFlat(recursive) {
    return function flatt(list) {
      var value,
          result = [],
          idx = 0,
          j,
          ilen = list.length,
          jlen;
      while (idx < ilen) {
        if (isArrayLike(list[idx])) {
          value = recursive ? flatt(list[idx]) : list[idx];
          j = 0;
          jlen = value.length;
          while (j < jlen) {
            result[result.length] = value[j];
            j += 1;
          }
        } else {
          result[result.length] = list[idx];
        }
        idx += 1;
      }
      return result;
    };
  };
  return module.exports;
});

$__System.registerDynamic("a", ["10", "e"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry1 = $__require('10');
  var _makeFlat = $__require('e');
  module.exports = _curry1(_makeFlat(true));
  return module.exports;
});

$__System.registerDynamic("11", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _map(fn, functor) {
    var idx = 0;
    var len = functor.length;
    var result = Array(len);
    while (idx < len) {
      result[idx] = fn(functor[idx]);
      idx += 1;
    }
    return result;
  };
  return module.exports;
});

$__System.registerDynamic("12", ["7", "13"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry2 = $__require('7');
  var _xfBase = $__require('13');
  module.exports = (function() {
    function XMap(f, xf) {
      this.xf = xf;
      this.f = f;
    }
    XMap.prototype['@@transducer/init'] = _xfBase.init;
    XMap.prototype['@@transducer/result'] = _xfBase.result;
    XMap.prototype['@@transducer/step'] = function(result, input) {
      return this.xf['@@transducer/step'](result, this.f(input));
    };
    return _curry2(function _xmap(f, xf) {
      return new XMap(f, xf);
    });
  })();
  return module.exports;
});

$__System.registerDynamic("14", ["15"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _arity = $__require('15');
  module.exports = function _curryN(length, received, fn) {
    return function() {
      var combined = [];
      var argsIdx = 0;
      var left = length;
      var combinedIdx = 0;
      while (combinedIdx < received.length || argsIdx < arguments.length) {
        var result;
        if (combinedIdx < received.length && (received[combinedIdx] == null || received[combinedIdx]['@@functional/placeholder'] !== true || argsIdx >= arguments.length)) {
          result = received[combinedIdx];
        } else {
          result = arguments[argsIdx];
          argsIdx += 1;
        }
        combined[combinedIdx] = result;
        if (result == null || result['@@functional/placeholder'] !== true) {
          left -= 1;
        }
        combinedIdx += 1;
      }
      return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
    };
  };
  return module.exports;
});

$__System.registerDynamic("16", ["15", "10", "7", "14"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _arity = $__require('15');
  var _curry1 = $__require('10');
  var _curry2 = $__require('7');
  var _curryN = $__require('14');
  module.exports = _curry2(function curryN(length, fn) {
    if (length === 1) {
      return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
  });
  return module.exports;
});

$__System.registerDynamic("17", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _has(prop, obj) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
  return module.exports;
});

$__System.registerDynamic("18", ["10", "17"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry1 = $__require('10');
  var _has = $__require('17');
  module.exports = (function() {
    var hasEnumBug = !({toString: null}).propertyIsEnumerable('toString');
    var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
    var contains = function contains(list, item) {
      var idx = 0;
      while (idx < list.length) {
        if (list[idx] === item) {
          return true;
        }
        idx += 1;
      }
      return false;
    };
    return typeof Object.keys === 'function' ? _curry1(function keys(obj) {
      return Object(obj) !== obj ? [] : Object.keys(obj);
    }) : _curry1(function keys(obj) {
      if (Object(obj) !== obj) {
        return [];
      }
      var prop,
          ks = [],
          nIdx;
      for (prop in obj) {
        if (_has(prop, obj)) {
          ks[ks.length] = prop;
        }
      }
      if (hasEnumBug) {
        nIdx = nonEnumerableProps.length - 1;
        while (nIdx >= 0) {
          prop = nonEnumerableProps[nIdx];
          if (_has(prop, obj) && !contains(ks, prop)) {
            ks[ks.length] = prop;
          }
          nIdx -= 1;
        }
      }
      return ks;
    });
  }());
  return module.exports;
});

$__System.registerDynamic("9", ["7", "19", "11", "1a", "12", "16", "18"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry2 = $__require('7');
  var _dispatchable = $__require('19');
  var _map = $__require('11');
  var _reduce = $__require('1a');
  var _xmap = $__require('12');
  var curryN = $__require('16');
  var keys = $__require('18');
  module.exports = _curry2(_dispatchable('map', _xmap, function map(fn, functor) {
    switch (Object.prototype.toString.call(functor)) {
      case '[object Function]':
        return curryN(functor.length, function() {
          return fn.call(this, functor.apply(this, arguments));
        });
      case '[object Object]':
        return _reduce(function(acc, key) {
          acc[key] = fn(functor[key]);
          return acc;
        }, {}, keys(functor));
      default:
        return _map(fn, functor);
    }
  }));
  return module.exports;
});

$__System.registerDynamic("1b", ["7"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry2 = $__require('7');
  module.exports = _curry2(function prop(p, obj) {
    return obj[p];
  });
  return module.exports;
});

$__System.registerDynamic("1c", ["7", "9", "1b"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry2 = $__require('7');
  var map = $__require('9');
  var prop = $__require('1b');
  module.exports = _curry2(function pluck(p, list) {
    return map(prop(p), list);
  });
  return module.exports;
});

$__System.registerDynamic("1d", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _pipe(f, g) {
    return function() {
      return g.call(this, f.apply(this, arguments));
    };
  };
  return module.exports;
});

$__System.registerDynamic("1e", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = (function() {
    function XWrap(fn) {
      this.f = fn;
    }
    XWrap.prototype['@@transducer/init'] = function() {
      throw new Error('init not implemented on XWrap');
    };
    XWrap.prototype['@@transducer/result'] = function(acc) {
      return acc;
    };
    XWrap.prototype['@@transducer/step'] = function(acc, x) {
      return this.f(acc, x);
    };
    return function _xwrap(fn) {
      return new XWrap(fn);
    };
  }());
  return module.exports;
});

$__System.registerDynamic("15", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _arity(n, fn) {
    switch (n) {
      case 0:
        return function() {
          return fn.apply(this, arguments);
        };
      case 1:
        return function(a0) {
          return fn.apply(this, arguments);
        };
      case 2:
        return function(a0, a1) {
          return fn.apply(this, arguments);
        };
      case 3:
        return function(a0, a1, a2) {
          return fn.apply(this, arguments);
        };
      case 4:
        return function(a0, a1, a2, a3) {
          return fn.apply(this, arguments);
        };
      case 5:
        return function(a0, a1, a2, a3, a4) {
          return fn.apply(this, arguments);
        };
      case 6:
        return function(a0, a1, a2, a3, a4, a5) {
          return fn.apply(this, arguments);
        };
      case 7:
        return function(a0, a1, a2, a3, a4, a5, a6) {
          return fn.apply(this, arguments);
        };
      case 8:
        return function(a0, a1, a2, a3, a4, a5, a6, a7) {
          return fn.apply(this, arguments);
        };
      case 9:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
          return fn.apply(this, arguments);
        };
      case 10:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          return fn.apply(this, arguments);
        };
      default:
        throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
    }
  };
  return module.exports;
});

$__System.registerDynamic("1f", ["15", "7"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _arity = $__require('15');
  var _curry2 = $__require('7');
  module.exports = _curry2(function bind(fn, thisObj) {
    return _arity(fn.length, function() {
      return fn.apply(thisObj, arguments);
    });
  });
  return module.exports;
});

$__System.registerDynamic("f", ["10", "20"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry1 = $__require('10');
  var _isArray = $__require('20');
  module.exports = _curry1(function isArrayLike(x) {
    if (_isArray(x)) {
      return true;
    }
    if (!x) {
      return false;
    }
    if (typeof x !== 'object') {
      return false;
    }
    if (x instanceof String) {
      return false;
    }
    if (x.nodeType === 1) {
      return !!x.length;
    }
    if (x.length === 0) {
      return true;
    }
    if (x.length > 0) {
      return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
    }
    return false;
  });
  return module.exports;
});

$__System.registerDynamic("1a", ["1e", "1f", "f"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _xwrap = $__require('1e');
  var bind = $__require('1f');
  var isArrayLike = $__require('f');
  module.exports = (function() {
    function _arrayReduce(xf, acc, list) {
      var idx = 0,
          len = list.length;
      while (idx < len) {
        acc = xf['@@transducer/step'](acc, list[idx]);
        if (acc && acc['@@transducer/reduced']) {
          acc = acc['@@transducer/value'];
          break;
        }
        idx += 1;
      }
      return xf['@@transducer/result'](acc);
    }
    function _iterableReduce(xf, acc, iter) {
      var step = iter.next();
      while (!step.done) {
        acc = xf['@@transducer/step'](acc, step.value);
        if (acc && acc['@@transducer/reduced']) {
          acc = acc['@@transducer/value'];
          break;
        }
        step = iter.next();
      }
      return xf['@@transducer/result'](acc);
    }
    function _methodReduce(xf, acc, obj) {
      return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
    }
    var symIterator = (typeof Symbol !== 'undefined') ? Symbol.iterator : '@@iterator';
    return function _reduce(fn, acc, list) {
      if (typeof fn === 'function') {
        fn = _xwrap(fn);
      }
      if (isArrayLike(list)) {
        return _arrayReduce(fn, acc, list);
      }
      if (typeof list.reduce === 'function') {
        return _methodReduce(fn, acc, list);
      }
      if (list[symIterator] != null) {
        return _iterableReduce(fn, acc, list[symIterator]());
      }
      if (typeof list.next === 'function') {
        return _iterableReduce(fn, acc, list);
      }
      throw new TypeError('reduce: list must be array or iterable');
    };
  })();
  return module.exports;
});

$__System.registerDynamic("21", ["22", "1a"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry3 = $__require('22');
  var _reduce = $__require('1a');
  module.exports = _curry3(_reduce);
  return module.exports;
});

$__System.registerDynamic("6", ["20", "23"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _isArray = $__require('20');
  var _slice = $__require('23');
  module.exports = function _checkForMethod(methodname, fn) {
    return function() {
      var length = arguments.length;
      if (length === 0) {
        return fn();
      }
      var obj = arguments[length - 1];
      return (_isArray(obj) || typeof obj[methodname] !== 'function') ? fn.apply(this, arguments) : obj[methodname].apply(obj, _slice(arguments, 0, length - 1));
    };
  };
  return module.exports;
});

$__System.registerDynamic("22", ["10", "7"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry1 = $__require('10');
  var _curry2 = $__require('7');
  module.exports = function _curry3(fn) {
    return function f3(a, b, c) {
      var n = arguments.length;
      if (n === 0) {
        return f3;
      } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
        return f3;
      } else if (n === 1) {
        return _curry2(function(b, c) {
          return fn(a, b, c);
        });
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
        return f3;
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
        return _curry2(function(a, c) {
          return fn(a, b, c);
        });
      } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
        return _curry2(function(b, c) {
          return fn(a, b, c);
        });
      } else if (n === 2) {
        return _curry1(function(c) {
          return fn(a, b, c);
        });
      } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
        return f3;
      } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
        return _curry2(function(a, b) {
          return fn(a, b, c);
        });
      } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
        return _curry2(function(a, c) {
          return fn(a, b, c);
        });
      } else if (n === 3 && b != null && b['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
        return _curry2(function(b, c) {
          return fn(a, b, c);
        });
      } else if (n === 3 && a != null && a['@@functional/placeholder'] === true) {
        return _curry1(function(a) {
          return fn(a, b, c);
        });
      } else if (n === 3 && b != null && b['@@functional/placeholder'] === true) {
        return _curry1(function(b) {
          return fn(a, b, c);
        });
      } else if (n === 3 && c != null && c['@@functional/placeholder'] === true) {
        return _curry1(function(c) {
          return fn(a, b, c);
        });
      } else {
        return fn(a, b, c);
      }
    };
  };
  return module.exports;
});

$__System.registerDynamic("24", ["6", "22"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _checkForMethod = $__require('6');
  var _curry3 = $__require('22');
  module.exports = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
    return Array.prototype.slice.call(list, fromIndex, toIndex);
  }));
  return module.exports;
});

$__System.registerDynamic("25", ["6", "24"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _checkForMethod = $__require('6');
  var slice = $__require('24');
  module.exports = _checkForMethod('tail', slice(1, Infinity));
  return module.exports;
});

$__System.registerDynamic("26", ["15", "1d", "21", "25"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _arity = $__require('15');
  var _pipe = $__require('1d');
  var reduce = $__require('21');
  var tail = $__require('25');
  module.exports = function pipe() {
    if (arguments.length === 0) {
      throw new Error('pipe requires at least one argument');
    }
    return _arity(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
  };
  return module.exports;
});

$__System.registerDynamic("27", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
  };
  return module.exports;
});

$__System.registerDynamic("28", ["10", "27", "23"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry1 = $__require('10');
  var _isString = $__require('27');
  var _slice = $__require('23');
  module.exports = _curry1(function reverse(list) {
    return _isString(list) ? list.split('').reverse().join('') : _slice(list).reverse();
  });
  return module.exports;
});

$__System.registerDynamic("b", ["26", "28"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var pipe = $__require('26');
  var reverse = $__require('28');
  module.exports = function compose() {
    if (arguments.length === 0) {
      throw new Error('compose requires at least one argument');
    }
    return pipe.apply(this, reverse(arguments));
  };
  return module.exports;
});

$__System.register("29", ["d", "9", "a", "1c", "b", "c"], function($__export) {
  "use strict";
  var Signal,
      map,
      flatten,
      pluck,
      compose,
      filter,
      defaultMapFn;
  return {
    setters: [function($__m) {
      Signal = $__m.default;
    }, function($__m) {
      map = $__m.default;
    }, function($__m) {
      flatten = $__m.default;
    }, function($__m) {
      pluck = $__m.default;
    }, function($__m) {
      compose = $__m.default;
    }, function($__m) {
      filter = $__m.default;
    }],
    execute: function() {
      defaultMapFn = function(node) {
        return [node].concat(Array.prototype.slice.call(node.querySelectorAll("[data-mediator]"), 0));
      };
      $__export('default', function() {
        var mapFn = arguments[0] !== (void 0) ? arguments[0] : defaultMapFn;
        var root = arguments[1] !== (void 0) ? arguments[1] : document.body;
        var onAdded = Signal();
        var onRemoved = Signal();
        function makeChain(prop, emit) {
          return compose(emit, filter(function(nodes) {
            return nodes.length > 0;
          }), map(mapFn), filter(function(node) {
            return node.querySelectorAll;
          }), flatten, pluck(prop));
        }
        var getAdded = makeChain("addedNodes", onAdded.emit);
        var getRemoved = makeChain("removedNodes", onRemoved.emit);
        var handleMutations = function(mutations) {
          getAdded(mutations);
          getRemoved(mutations);
          var attributesChanged = mutations.filter(function(mutation) {
            return mutation.type == "attributes" && mutation.attributeName == "mediatorid" && mutation.target.getAttribute("mediatorid") == null;
          }).map(function(mutation) {
            return mutation.target;
          });
          onRemoved.emit(attributesChanged);
          onAdded.emit(attributesChanged);
        };
        var observer = new MutationObserver(handleMutations);
        observer.observe(root, {
          attributes: true,
          childList: true,
          characterData: false,
          subtree: true
        });
        return Object.freeze({
          onAdded: onAdded,
          onRemoved: onRemoved
        });
      });
    }
  };
});

$__System.register("2a", [], function($__export) {
  "use strict";
  function getPromise() {
    if (System.import) {
      return function(url) {
        return System.import(url);
      };
    } else {
      return function(url) {
        return Promise.resolve(System.get(url));
      };
    }
  }
  return {
    setters: [],
    execute: function() {
      $__export('default', Object.freeze({load: function(id) {
          return getPromise()(id).then(function(e) {
            return e.default ? e.default : e;
          }).catch(function(e) {
            console.log(e);
          });
        }}));
    }
  };
});

$__System.register("4", [], function($__export) {
  "use strict";
  var dispatcher,
      makeDispatcher;
  return {
    setters: [],
    execute: function() {
      dispatcher = function() {
        var _currentListeners = {};
        return Object.freeze({
          addEventListener: function(eventName, callback, scope) {
            var listener = {
              eventName: eventName,
              callback: callback,
              scope: scope
            };
            _currentListeners[eventName] = _currentListeners[eventName] ? _currentListeners[eventName].concat([listener]) : [].concat([listener]);
            return listener;
          },
          removeEventListener: function(eventName, _callback, _scope) {
            _currentListeners[eventName] && (_currentListeners[eventName] = _currentListeners[eventName].filter(function($__3) {
              var $__4 = $__3,
                  callback = $__4.callback,
                  scope = $__4.scope;
              return !((callback === _callback) && (scope === _scope));
            }));
          },
          removeAllEventListeners: function(eventName) {
            _currentListeners[eventName] = null;
            delete _currentListeners[eventName];
          },
          hasEventListener: function(eventName) {
            return _currentListeners[eventName] && _currentListeners[eventName].length;
          },
          dispatchEvent: function(eventName, data) {
            _currentListeners[eventName] && _currentListeners[eventName].forEach(function($__3) {
              var $__4 = $__3,
                  callback = $__4.callback,
                  scope = $__4.scope;
              callback.call(scope, data);
            });
          }
        });
      };
      $__export('default', dispatcher());
      makeDispatcher = function() {
        return Object.assign({}, dispatcher());
      };
      $__export("makeDispatcher", makeDispatcher);
    }
  };
});

$__System.registerDynamic("2b", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _reduced(x) {
    return x && x['@@transducer/reduced'] ? x : {
      '@@transducer/value': x,
      '@@transducer/reduced': true
    };
  };
  return module.exports;
});

$__System.registerDynamic("2c", ["7", "2b", "13"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry2 = $__require('7');
  var _reduced = $__require('2b');
  var _xfBase = $__require('13');
  module.exports = (function() {
    function XFind(f, xf) {
      this.xf = xf;
      this.f = f;
      this.found = false;
    }
    XFind.prototype['@@transducer/init'] = _xfBase.init;
    XFind.prototype['@@transducer/result'] = function(result) {
      if (!this.found) {
        result = this.xf['@@transducer/step'](result, void 0);
      }
      return this.xf['@@transducer/result'](result);
    };
    XFind.prototype['@@transducer/step'] = function(result, input) {
      if (this.f(input)) {
        this.found = true;
        result = _reduced(this.xf['@@transducer/step'](result, input));
      }
      return result;
    };
    return _curry2(function _xfind(f, xf) {
      return new XFind(f, xf);
    });
  })();
  return module.exports;
});

$__System.registerDynamic("2d", ["7", "19", "2c"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry2 = $__require('7');
  var _dispatchable = $__require('19');
  var _xfind = $__require('2c');
  module.exports = _curry2(_dispatchable('find', _xfind, function find(fn, list) {
    var idx = 0;
    var len = list.length;
    while (idx < len) {
      if (fn(list[idx])) {
        return list[idx];
      }
      idx += 1;
    }
  }));
  return module.exports;
});

$__System.registerDynamic("20", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = Array.isArray || function _isArray(val) {
    return (val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]');
  };
  return module.exports;
});

$__System.registerDynamic("2e", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _isTransformer(obj) {
    return typeof obj['@@transducer/step'] === 'function';
  };
  return module.exports;
});

$__System.registerDynamic("23", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _slice(args, from, to) {
    switch (arguments.length) {
      case 1:
        return _slice(args, 0, args.length);
      case 2:
        return _slice(args, from, args.length);
      default:
        var list = [];
        var idx = 0;
        var len = Math.max(0, Math.min(args.length, to) - from);
        while (idx < len) {
          list[idx] = args[from + idx];
          idx += 1;
        }
        return list;
    }
  };
  return module.exports;
});

$__System.registerDynamic("19", ["20", "2e", "23"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _isArray = $__require('20');
  var _isTransformer = $__require('2e');
  var _slice = $__require('23');
  module.exports = function _dispatchable(methodname, xf, fn) {
    return function() {
      var length = arguments.length;
      if (length === 0) {
        return fn();
      }
      var obj = arguments[length - 1];
      if (!_isArray(obj)) {
        var args = _slice(arguments, 0, length - 1);
        if (typeof obj[methodname] === 'function') {
          return obj[methodname].apply(obj, args);
        }
        if (_isTransformer(obj)) {
          var transducer = xf.apply(null, args);
          return transducer(obj);
        }
      }
      return fn.apply(this, arguments);
    };
  };
  return module.exports;
});

$__System.registerDynamic("2f", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _filter(fn, list) {
    var idx = 0,
        len = list.length,
        result = [];
    while (idx < len) {
      if (fn(list[idx])) {
        result[result.length] = list[idx];
      }
      idx += 1;
    }
    return result;
  };
  return module.exports;
});

$__System.registerDynamic("10", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function _curry1(fn) {
    return function f1(a) {
      if (arguments.length === 0) {
        return f1;
      } else if (a != null && a['@@functional/placeholder'] === true) {
        return f1;
      } else {
        return fn.apply(this, arguments);
      }
    };
  };
  return module.exports;
});

$__System.registerDynamic("7", ["10"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry1 = $__require('10');
  module.exports = function _curry2(fn) {
    return function f2(a, b) {
      var n = arguments.length;
      if (n === 0) {
        return f2;
      } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
        return f2;
      } else if (n === 1) {
        return _curry1(function(b) {
          return fn(a, b);
        });
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
        return f2;
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
        return _curry1(function(a) {
          return fn(a, b);
        });
      } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
        return _curry1(function(b) {
          return fn(a, b);
        });
      } else {
        return fn(a, b);
      }
    };
  };
  return module.exports;
});

$__System.registerDynamic("13", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = {
    init: function() {
      return this.xf['@@transducer/init']();
    },
    result: function(result) {
      return this.xf['@@transducer/result'](result);
    }
  };
  return module.exports;
});

$__System.registerDynamic("30", ["7", "13"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry2 = $__require('7');
  var _xfBase = $__require('13');
  module.exports = (function() {
    function XFilter(f, xf) {
      this.xf = xf;
      this.f = f;
    }
    XFilter.prototype['@@transducer/init'] = _xfBase.init;
    XFilter.prototype['@@transducer/result'] = _xfBase.result;
    XFilter.prototype['@@transducer/step'] = function(result, input) {
      return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
    };
    return _curry2(function _xfilter(f, xf) {
      return new XFilter(f, xf);
    });
  })();
  return module.exports;
});

$__System.registerDynamic("c", ["7", "19", "2f", "30"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _curry2 = $__require('7');
  var _dispatchable = $__require('19');
  var _filter = $__require('2f');
  var _xfilter = $__require('30');
  module.exports = _curry2(_dispatchable('filter', _xfilter, _filter));
  return module.exports;
});

$__System.register("31", ["4", "2d", "c"], function($__export) {
  "use strict";
  var EventDispatcher,
      find,
      filter;
  return {
    setters: [function($__m) {
      EventDispatcher = $__m.default;
    }, function($__m) {
      find = $__m.default;
    }, function($__m) {
      filter = $__m.default;
    }],
    execute: function() {
      $__export('default', function() {
        var nextUid = function() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };
        var MEDIATORS_CACHE = [];
        function create(node) {
          return function(Mediator) {
            var mediatorId = nextUid();
            node.setAttribute('mediatorid', mediatorId);
            var disposeFunction = Mediator(node, EventDispatcher);
            MEDIATORS_CACHE.push({
              mediatorId: mediatorId,
              node: node,
              disposeFunction: disposeFunction
            });
            return true;
          };
        }
        function destroy(node) {
          var mediatorId = node.getAttribute("mediatorid");
          var mediator = find(function(mediator) {
            return mediator.node == node;
          }, MEDIATORS_CACHE);
          console.log(node, mediator);
          if (mediator.disposeFunction) {
            mediator.disposeFunction();
            return true;
          }
          MEDIATORS_CACHE = filter(function(_mediator) {
            return mediator == mediator;
          }, MEDIATORS_CACHE);
          return false;
        }
        var findMediators = function(definitions, loader) {
          return function(node) {
            return loader.load(definitions[node.getAttribute("data-mediator")]).then(create(node));
          };
        };
        var hasMediator = function(definitions) {
          return function(node) {
            return (definitions[node.getAttribute("data-mediator")] && !node.getAttribute("mediatorid"));
          };
        };
        var getAllElements = function(node) {
          return [node].concat([].slice.call(node.querySelectorAll("[data-mediator]"), 0));
        };
        return Object.freeze({
          destroy: destroy,
          findMediators: findMediators,
          hasMediator: hasMediator,
          getAllElements: getAllElements
        });
      });
      ;
    }
  };
});

$__System.register("32", ["8", "29", "2a", "31"], function($__export) {
  "use strict";
  var MediatorsBuilder,
      DomWatcher,
      ScriptLoader,
      MediatorHandler;
  return {
    setters: [function($__m) {
      MediatorsBuilder = $__m.default;
    }, function($__m) {
      DomWatcher = $__m.default;
    }, function($__m) {
      ScriptLoader = $__m.default;
    }, function($__m) {
      MediatorHandler = $__m.default;
    }],
    execute: function() {
      $__export('default', function($__1) {
        var $__3,
            $__4,
            $__5;
        var $__2 = $__1,
            definitions = $__2.definitions,
            domWatcher = ($__3 = $__2.domWatcher) === void 0 ? DomWatcher : $__3,
            loader = ($__4 = $__2.loader) === void 0 ? ScriptLoader : $__4,
            mediatorHandler = ($__5 = $__2.mediatorHandler) === void 0 ? MediatorHandler() : $__5;
        return MediatorsBuilder(domWatcher, loader, mediatorHandler, definitions).bootstrap();
      });
    }
  };
});

$__System.register("1", ["2a", "2", "4", "d", "29", "8", "3", "32"], function($__export) {
  "use strict";
  var sl,
      amdl,
      ed,
      s,
      dw,
      mb,
      ceh,
      boot,
      ScriptLoader,
      AMDScriptLoader,
      EventDispatcher,
      Signal,
      DomWatcher,
      MediatorsBuilder,
      CustomElementHandler,
      bootstrap;
  return {
    setters: [function($__m) {
      sl = $__m.default;
    }, function($__m) {
      amdl = $__m.default;
    }, function($__m) {
      ed = $__m.default;
    }, function($__m) {
      s = $__m.default;
    }, function($__m) {
      dw = $__m.default;
    }, function($__m) {
      mb = $__m.default;
    }, function($__m) {
      ceh = $__m.default;
    }, function($__m) {
      boot = $__m.default;
    }],
    execute: function() {
      ScriptLoader = sl;
      $__export("ScriptLoader", ScriptLoader);
      AMDScriptLoader = amdl;
      $__export("AMDScriptLoader", AMDScriptLoader);
      EventDispatcher = ed;
      $__export("EventDispatcher", EventDispatcher);
      Signal = s;
      $__export("Signal", Signal);
      DomWatcher = dw;
      $__export("DomWatcher", DomWatcher);
      MediatorsBuilder = mb;
      $__export("MediatorsBuilder", MediatorsBuilder);
      CustomElementHandler = ceh;
      $__export("CustomElementHandler", CustomElementHandler);
      bootstrap = boot;
      $__export("bootstrap", bootstrap);
    }
  };
});

})
(function(factory) {
  define([], factory);
});
//# sourceMappingURL=robojs.es6.js.map