"format amd";
(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  var getOwnPropertyDescriptor = true;
  try {
    Object.getOwnPropertyDescriptor({ a: 0 }, 'a');
  }
  catch(e) {
    getOwnPropertyDescriptor = false;
  }

  var defineProperty;
  (function () {
    try {
      if (!!Object.defineProperty({}, 'a', {}))
        defineProperty = Object.defineProperty;
    }
    catch (e) {
      defineProperty = function(obj, prop, opt) {
        try {
          obj[prop] = opt.value || opt.get.call(obj);
        }
        catch(e) {}
      }
    }
  })();

  function register(name, deps, declare) {
    if (arguments.length === 4)
      return registerDynamic.apply(this, arguments);
    doRegister(name, {
      declarative: true,
      deps: deps,
      declare: declare
    });
  }

  function registerDynamic(name, deps, executingRequire, execute) {
    doRegister(name, {
      declarative: false,
      deps: deps,
      executingRequire: executingRequire,
      execute: execute
    });
  }

  function doRegister(name, entry) {
    entry.name = name;

    // we never overwrite an existing define
    if (!(name in defined))
      defined[name] = entry;

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }


  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {

        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry);
        else
          linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    })
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function(name, value) {
      module.locked = true;

      if (typeof name == 'object') {
        for (var p in name)
          exports[p] = name[p];
      }
      else {
        exports[name] = value;
      }

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          for (var j = 0; j < importerModule.dependencies.length; ++j) {
            if (importerModule.dependencies[j] === module) {
              importerModule.setters[j](exports);
            }
          }
        }
      }

      module.locked = false;
      return value;
    });

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      else if (depEntry && !depEntry.declarative) {
        depExports = depEntry.esModule;
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else
        module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports)
        throw new Error("Unable to load dependency " + name + ".");
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, []);

      else if (!entry.evaluated)
        linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError('Module ' + name + ' not declared as a dependency.');
    }, exports, module);

    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;
 
    if (exports && exports.__esModule) {
      entry.esModule = exports;
    }
    else {
      entry.esModule = {};
      
      // don't trigger getters/setters in environments that support them
      if (typeof exports == 'object' || typeof exports == 'function') {
        if (getOwnPropertyDescriptor) {
          var d;
          for (var p in exports)
            if (d = Object.getOwnPropertyDescriptor(exports, p))
              defineProperty(entry.esModule, p, d);
        }
        else {
          var hasOwnProperty = exports && exports.hasOwnProperty;
          for (var p in exports) {
            if (!hasOwnProperty || exports.hasOwnProperty(p))
              entry.esModule[p] = exports[p];
          }
         }
       }
      entry.esModule['default'] = exports;
      defineProperty(entry.esModule, '__useDefault', {
        value: true
      });
    }
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName])
          load(depName);
        else
          ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name])
      return modules[name];

    // node core modules
    if (name.substr(0, 6) == '@node/')
      return require(name.substr(6));

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry)
      throw "Module " + name + " not present.";

    // recursively ensure that the module and all its 
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    // exported modules get __esModule defined for interop
    if (entry.declarative)
      defineProperty(entry.module.exports, '__esModule', { value: true });

    // return the defined module object
    return modules[name] = entry.declarative ? entry.module.exports : entry.esModule;
  };

  return function(mains, depNames, declare) {
    return function(formatDetect) {
      formatDetect(function(deps) {
        var System = {
          _nodeRequire: typeof require != 'undefined' && require.resolve && typeof process != 'undefined' && require,
          register: register,
          registerDynamic: registerDynamic,
          get: load, 
          set: function(name, module) {
            modules[name] = module; 
          },
          newModule: function(module) {
            return module;
          }
        };
        System.set('@empty', {});

        // register external dependencies
        for (var i = 0; i < depNames.length; i++) (function(depName, dep) {
          if (dep && dep.__esModule)
            System.register(depName, [], function(_export) {
              return {
                setters: [],
                execute: function() {
                  for (var p in dep)
                    if (p != '__esModule' && !(typeof p == 'object' && p + '' == 'Module'))
                      _export(p, dep[p]);
                }
              };
            });
          else
            System.registerDynamic(depName, [], false, function() {
              return dep;
            });
        })(depNames[i], arguments[i]);

        // register modules in this bundle
        declare(System);

        // load mains
        var firstLoad = load(mains[0]);
        if (mains.length > 1)
          for (var i = 1; i < mains.length; i++)
            load(mains[i]);

        if (firstLoad.__useDefault)
          return firstLoad['default'];
        else
          return firstLoad;
      });
    };
  };

})(typeof self != 'undefined' ? self : global)
/* (['mainModule'], ['external-dep'], function($__System) {
  System.register(...);
})
(function(factory) {
  if (typeof define && define.amd)
    define(['external-dep'], factory);
  // etc UMD / module pattern
})*/

(['1'], [], function($__System) {

$__System.register("2", [], function($__export) {
  "use strict";
  var __moduleName = "2";
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

$__System.register("3", [], function($__export) {
  "use strict";
  var __moduleName = "3";
  return {
    setters: [],
    execute: function() {
      $__export('default', Object.freeze({load: function(id) {
          return new Promise(function(resolve, reject) {
            return window.require([id], resolve);
          });
        }}));
    }
  };
});

$__System.register("4", [], function($__export) {
  "use strict";
  var __moduleName = "4";
  var _currentListeners;
  return {
    setters: [],
    execute: function() {
      _currentListeners = {};
      $__export('default', Object.freeze({
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
      }));
    }
  };
});

$__System.register("5", [], function($__export) {
  "use strict";
  var __moduleName = "5";
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

$__System.registerDynamic("6", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7", ["6"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = req('6');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("8", ["7"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = req('7');
  module.exports = _curry2(function tap(fn, x) {
    fn(x);
    return x;
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("9", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = Array.isArray || function _isArray(val) {
    return (val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]');
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _isTransformer(obj) {
    return typeof obj['@@transducer/step'] === 'function';
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("b", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("c", ["9", "a", "b"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _isArray = req('9');
  var _isTransformer = req('a');
  var _slice = req('b');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("d", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("f", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("10", ["f", "7"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = req('f');
  var _curry2 = req('7');
  module.exports = _curry2(function bind(fn, thisObj) {
    return _arity(fn.length, function() {
      return fn.apply(thisObj, arguments);
    });
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("11", ["6", "9"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = req('6');
  var _isArray = req('9');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("12", ["e", "10", "11"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _xwrap = req('e');
  var bind = req('10');
  var isArrayLike = req('11');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("13", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    init: function() {
      return this.xf['@@transducer/init']();
    },
    result: function(result) {
      return this.xf['@@transducer/result'](result);
    }
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("14", ["7", "13"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = req('7');
  var _xfBase = req('13');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("15", ["f"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = req('f');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("16", ["f", "6", "7", "15"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = req('f');
  var _curry1 = req('6');
  var _curry2 = req('7');
  var _curryN = req('15');
  module.exports = _curry2(function curryN(length, fn) {
    if (length === 1) {
      return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("17", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _has(prop, obj) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("18", ["6", "17"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = req('6');
  var _has = req('17');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("19", ["7", "c", "d", "12", "14", "16", "18"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = req('7');
  var _dispatchable = req('c');
  var _map = req('d');
  var _reduce = req('12');
  var _xmap = req('14');
  var curryN = req('16');
  var keys = req('18');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1a", ["11"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var isArrayLike = req('11');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1b", ["6", "1a"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = req('6');
  var _makeFlat = req('1a');
  module.exports = _curry1(_makeFlat(true));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1c", ["7"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = req('7');
  module.exports = _curry2(function prop(p, obj) {
    return obj[p];
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1d", ["7", "19", "1c"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = req('7');
  var map = req('19');
  var prop = req('1c');
  module.exports = _curry2(function pluck(p, list) {
    return map(prop(p), list);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1e", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _pipe(f, g) {
    return function() {
      return g.call(this, f.apply(this, arguments));
    };
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1f", ["6", "7"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = req('6');
  var _curry2 = req('7');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("20", ["1f", "12"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry3 = req('1f');
  var _reduce = req('12');
  module.exports = _curry3(_reduce);
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("21", ["9", "b"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _isArray = req('9');
  var _slice = req('b');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("22", ["21", "1f"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _checkForMethod = req('21');
  var _curry3 = req('1f');
  module.exports = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
    return Array.prototype.slice.call(list, fromIndex, toIndex);
  }));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("23", ["21", "22"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _checkForMethod = req('21');
  var slice = req('22');
  module.exports = _checkForMethod('tail', slice(1, Infinity));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("24", ["f", "1e", "20", "23"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = req('f');
  var _pipe = req('1e');
  var reduce = req('20');
  var tail = req('23');
  module.exports = function pipe() {
    if (arguments.length === 0) {
      throw new Error('pipe requires at least one argument');
    }
    return _arity(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("25", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("26", ["6", "25", "b"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = req('6');
  var _isString = req('25');
  var _slice = req('b');
  module.exports = _curry1(function reverse(list) {
    return _isString(list) ? list.split('').reverse().join('') : _slice(list).reverse();
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("27", ["24", "26"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var pipe = req('24');
  var reverse = req('26');
  module.exports = function compose() {
    if (arguments.length === 0) {
      throw new Error('compose requires at least one argument');
    }
    return pipe.apply(this, reverse(arguments));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("28", [], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("29", ["7", "13"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = req('7');
  var _xfBase = req('13');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2a", ["7", "c", "28", "29"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = req('7');
  var _dispatchable = req('c');
  var _filter = req('28');
  var _xfilter = req('29');
  module.exports = _curry2(_dispatchable('filter', _xfilter, _filter));
  global.define = __define;
  return module.exports;
});

$__System.register("2b", ["5", "8", "19", "1b", "1d", "27", "2a"], function($__export) {
  "use strict";
  var __moduleName = "2b";
  var Signal,
      tap,
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
      tap = $__m.default;
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
          return compose(tap(function(nodes) {
            return (nodes.length && emit(nodes));
          }), map(mapFn), filter(function(node) {
            return node.querySelectorAll;
          }), flatten(), pluck(prop));
        }
        var getAdded = makeChain("addedNodes", onAdded.emit);
        var getRemoved = makeChain("removedNodes", onRemoved.emit);
        var handleMutations = function(mutations) {
          getAdded(mutations);
          getRemoved(mutations);
        };
        var observer = new MutationObserver(handleMutations);
        observer.observe(root, {
          attributes: false,
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

$__System.registerDynamic("2c", ["21", "7"], true, function(req, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _checkForMethod = req('21');
  var _curry2 = req('7');
  module.exports = _curry2(_checkForMethod('forEach', function forEach(fn, list) {
    var len = list.length;
    var idx = 0;
    while (idx < len) {
      fn(list[idx]);
      idx += 1;
    }
    return list;
  }));
  global.define = __define;
  return module.exports;
});

$__System.register("2d", ["19", "2c", "1b", "27", "2a"], function($__export) {
  "use strict";
  var __moduleName = "2d";
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
        var _handleNodesRemoved = compose(forEach(handler.destroy), flatten());
        var getMediators = compose(function(promises) {
          return Promise.all(promises);
        }, map(handler.findMediators(definitions, loader)), filter(handler.hasMediator(definitions)), flatten());
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

$__System.register("2e", ["4"], function($__export) {
  "use strict";
  var __moduleName = "2e";
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

$__System.register("2f", ["4"], function($__export) {
  "use strict";
  var __moduleName = "2f";
  var EventDispatcher;
  return {
    setters: [function($__m) {
      EventDispatcher = $__m.default;
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
        var MEDIATORS_CACHE = {};
        function create(node) {
          return function(Mediator) {
            var mediatorId = nextUid();
            node.setAttribute('mediatorid', mediatorId);
            var _mediator = Mediator(node, EventDispatcher);
            MEDIATORS_CACHE[mediatorId] = _mediator;
            _mediator.initialize();
            return _mediator;
          };
        }
        function destroy(node) {
          var mediatorId = node.getAttribute("mediatorid");
          var mediator = MEDIATORS_CACHE[mediatorId];
          if (mediator) {
            mediator.destroy && mediator.destroy();
            MEDIATORS_CACHE[mediatorId] = null;
            delete MEDIATORS_CACHE[mediatorId];
            mediator = null;
            return true;
          }
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

$__System.register("30", ["2d", "2b", "2", "2f"], function($__export) {
  "use strict";
  var __moduleName = "30";
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

$__System.register("1", ["2", "3", "4", "5", "2b", "2d", "2e", "30"], function($__export) {
  "use strict";
  var __moduleName = "1";
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
  if (typeof define == 'function' && define.amd)
    define("robojs",[], factory);
  else
    window.robojs=factory();
});
//# sourceMappingURL=robojs.es6.js.map