(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  function dedupe(deps) {
    var newDeps = [];
    for (var i = 0, l = deps.length; i < l; i++)
      if (indexOf.call(newDeps, deps[i]) == -1)
        newDeps.push(deps[i])
    return newDeps;
  }

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

    entry.deps = dedupe(entry.deps);

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
      exports[name] = value;

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          var importerIndex = indexOf.call(importerModule.dependencies, module);
          importerModule.setters[importerIndex](exports);
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
      var hasOwnProperty = exports && exports.hasOwnProperty;
      entry.esModule = {};
      for (var p in exports) {
        if (!hasOwnProperty || exports.hasOwnProperty(p))
          entry.esModule[p] = exports[p];
      }
      entry.esModule['default'] = exports;
      entry.esModule.__useDefault = true;
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

    // return the defined module object
    return modules[name] = entry.declarative ? entry.module.exports : entry.esModule;
  };

  return function(mains, declare) {
    return function(formatDetect) {
      formatDetect(function() {
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
          },
          'import': function() {
            throw new TypeError('Dynamic System.import calls are not supported for SFX bundles. Rather use a named bundle.');
          }
        };
        System.set('@empty', {});

        declare(System);

        var firstLoad = load(mains[0]);
        if (mains.length > 1)
          for (var i = 1; i < mains.length; i++)
            load(mains[i]);

        return firstLoad;
      });
    };
  };

})(typeof self != 'undefined' ? self : global)
/* (['mainModule'], function(System) {
  System.register(...);
})
(function(factory) {
  if (typeof define && define.amd)
    define(factory);
  // etc UMD / module pattern
})*/

(['src/org/core/robojs.js'], function(System) {

System.registerDynamic("npm:process@0.10.1/browser.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var process = module.exports = {};
  var queue = [];
  var draining = false;
  function drainQueue() {
    if (draining) {
      return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while (len) {
      currentQueue = queue;
      queue = [];
      var i = -1;
      while (++i < len) {
        currentQueue[i]();
      }
      len = queue.length;
    }
    draining = false;
  }
  process.nextTick = function(fun) {
    queue.push(fun);
    if (!draining) {
      setTimeout(drainQueue, 0);
    }
  };
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = '';
  process.versions = {};
  function noop() {}
  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  process.binding = function(name) {
    throw new Error('process.binding is not supported');
  };
  process.cwd = function() {
    return '/';
  };
  process.chdir = function(dir) {
    throw new Error('process.chdir is not supported');
  };
  process.umask = function() {
    return 0;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:process@0.10.1.js", ["npm:process@0.10.1/browser.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:process@0.10.1/browser.js");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("github:jspm/nodelibs-process@0.1.1/index.js", ["npm:process@0.10.1.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = System._nodeRequire ? process : require("npm:process@0.10.1.js");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("github:jspm/nodelibs-process@0.1.1.js", ["github:jspm/nodelibs-process@0.1.1/index.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("github:jspm/nodelibs-process@0.1.1/index.js");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.15.1/dist/ramda.js", ["github:jspm/nodelibs-process@0.1.1.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  (function(process) {
    ;
    (function() {
      'use strict';
      var __ = {'@@functional/placeholder': true};
      var _add = function _add(a, b) {
        return a + b;
      };
      var _all = function _all(fn, list) {
        var idx = 0;
        while (idx < list.length) {
          if (!fn(list[idx])) {
            return false;
          }
          idx += 1;
        }
        return true;
      };
      var _any = function _any(fn, list) {
        var idx = 0;
        while (idx < list.length) {
          if (fn(list[idx])) {
            return true;
          }
          idx += 1;
        }
        return false;
      };
      var _assoc = function _assoc(prop, val, obj) {
        var result = {};
        for (var p in obj) {
          result[p] = obj[p];
        }
        result[prop] = val;
        return result;
      };
      var _cloneRegExp = function _cloneRegExp(pattern) {
        return new RegExp(pattern.source, (pattern.global ? 'g' : '') + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '') + (pattern.sticky ? 'y' : '') + (pattern.unicode ? 'u' : ''));
      };
      var _complement = function _complement(f) {
        return function() {
          return !f.apply(this, arguments);
        };
      };
      var _compose = function _compose(f, g) {
        return function() {
          return f.call(this, g.apply(this, arguments));
        };
      };
      var _concat = function _concat(set1, set2) {
        set1 = set1 || [];
        set2 = set2 || [];
        var idx;
        var len1 = set1.length;
        var len2 = set2.length;
        var result = [];
        idx = 0;
        while (idx < len1) {
          result[result.length] = set1[idx];
          idx += 1;
        }
        idx = 0;
        while (idx < len2) {
          result[result.length] = set2[idx];
          idx += 1;
        }
        return result;
      };
      var _containsWith = function _containsWith(pred, x, list) {
        var idx = 0,
            len = list.length;
        while (idx < len) {
          if (pred(x, list[idx])) {
            return true;
          }
          idx += 1;
        }
        return false;
      };
      var _createMapEntry = function _createMapEntry(key, val) {
        var obj = {};
        obj[key] = val;
        return obj;
      };
      var _createMaxMinBy = function _createMaxMinBy(comparator) {
        return function(valueComputer, list) {
          if (!(list && list.length > 0)) {
            return;
          }
          var idx = 1;
          var winner = list[idx];
          var computedWinner = valueComputer(winner);
          var computedCurrent;
          while (idx < list.length) {
            computedCurrent = valueComputer(list[idx]);
            if (comparator(computedCurrent, computedWinner)) {
              computedWinner = computedCurrent;
              winner = list[idx];
            }
            idx += 1;
          }
          return winner;
        };
      };
      var _curry1 = function _curry1(fn) {
        return function f1(a) {
          if (arguments.length === 0) {
            return f1;
          } else if (a != null && a['@@functional/placeholder'] === true) {
            return f1;
          } else {
            return fn(a);
          }
        };
      };
      var _curry2 = function _curry2(fn) {
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
      var _curry3 = function _curry3(fn) {
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
      var _dissoc = function _dissoc(prop, obj) {
        var result = {};
        for (var p in obj) {
          if (p !== prop) {
            result[p] = obj[p];
          }
        }
        return result;
      };
      var _eq = function _eq(x, y) {
        if (x === y) {
          return x !== 0 || 1 / x === 1 / y;
        } else {
          return x !== x && y !== y;
        }
      };
      var _filter = function _filter(fn, list) {
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
      var _filterIndexed = function _filterIndexed(fn, list) {
        var idx = 0,
            len = list.length,
            result = [];
        while (idx < len) {
          if (fn(list[idx], idx, list)) {
            result[result.length] = list[idx];
          }
          idx += 1;
        }
        return result;
      };
      var _forEach = function _forEach(fn, list) {
        var idx = 0,
            len = list.length;
        while (idx < len) {
          fn(list[idx]);
          idx += 1;
        }
        return list;
      };
      var _forceReduced = function _forceReduced(x) {
        return {
          '@@transducer/value': x,
          '@@transducer/reduced': true
        };
      };
      var _functionsWith = function _functionsWith(fn) {
        return function(obj) {
          return _filter(function(key) {
            return typeof obj[key] === 'function';
          }, fn(obj));
        };
      };
      var _gt = function _gt(a, b) {
        return a > b;
      };
      var _has = function _has(prop, obj) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
      };
      var _identity = function _identity(x) {
        return x;
      };
      var _isArray = Array.isArray || function _isArray(val) {
        return val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]';
      };
      var _isInteger = Number.isInteger || function _isInteger(n) {
        return n << 0 === n;
      };
      var _isThenable = function _isThenable(value) {
        return value != null && value === Object(value) && typeof value.then === 'function';
      };
      var _isTransformer = function _isTransformer(obj) {
        return typeof obj['@@transducer/step'] === 'function';
      };
      var _lt = function _lt(a, b) {
        return a < b;
      };
      var _map = function _map(fn, list) {
        var idx = 0,
            len = list.length,
            result = [];
        while (idx < len) {
          result[idx] = fn(list[idx]);
          idx += 1;
        }
        return result;
      };
      var _multiply = function _multiply(a, b) {
        return a * b;
      };
      var _nth = function _nth(n, list) {
        return n < 0 ? list[list.length + n] : list[n];
      };
      var _path = function _path(paths, obj) {
        if (obj == null) {
          return;
        } else {
          var val = obj;
          for (var idx = 0,
              len = paths.length; idx < len && val != null; idx += 1) {
            val = val[paths[idx]];
          }
          return val;
        }
      };
      var _prepend = function _prepend(el, list) {
        return _concat([el], list);
      };
      var _quote = function _quote(s) {
        return '"' + s.replace(/"/g, '\\"') + '"';
      };
      var _reduced = function _reduced(x) {
        return x && x['@@transducer/reduced'] ? x : {
          '@@transducer/value': x,
          '@@transducer/reduced': true
        };
      };
      var _slice = function _slice(args, from, to) {
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
      var _toISOString = function() {
        var pad = function pad(n) {
          return (n < 10 ? '0' : '') + n;
        };
        return typeof Date.prototype.toISOString === 'function' ? function _toISOString(d) {
          return d.toISOString();
        } : function _toISOString(d) {
          return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
        };
      }();
      var _xdropRepeatsWith = function() {
        function XDropRepeatsWith(pred, xf) {
          this.xf = xf;
          this.pred = pred;
          this.lastValue = undefined;
          this.seenFirstValue = false;
        }
        XDropRepeatsWith.prototype['@@transducer/init'] = function() {
          return this.xf['@@transducer/init']();
        };
        XDropRepeatsWith.prototype['@@transducer/result'] = function(result) {
          return this.xf['@@transducer/result'](result);
        };
        XDropRepeatsWith.prototype['@@transducer/step'] = function(result, input) {
          var sameAsLast = false;
          if (!this.seenFirstValue) {
            this.seenFirstValue = true;
          } else if (this.pred(this.lastValue, input)) {
            sameAsLast = true;
          }
          this.lastValue = input;
          return sameAsLast ? result : this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xdropRepeatsWith(pred, xf) {
          return new XDropRepeatsWith(pred, xf);
        });
      }();
      var _xfBase = {
        init: function() {
          return this.xf['@@transducer/init']();
        },
        result: function(result) {
          return this.xf['@@transducer/result'](result);
        }
      };
      var _xfilter = function() {
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
      }();
      var _xfind = function() {
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
      }();
      var _xfindIndex = function() {
        function XFindIndex(f, xf) {
          this.xf = xf;
          this.f = f;
          this.idx = -1;
          this.found = false;
        }
        XFindIndex.prototype['@@transducer/init'] = _xfBase.init;
        XFindIndex.prototype['@@transducer/result'] = function(result) {
          if (!this.found) {
            result = this.xf['@@transducer/step'](result, -1);
          }
          return this.xf['@@transducer/result'](result);
        };
        XFindIndex.prototype['@@transducer/step'] = function(result, input) {
          this.idx += 1;
          if (this.f(input)) {
            this.found = true;
            result = _reduced(this.xf['@@transducer/step'](result, this.idx));
          }
          return result;
        };
        return _curry2(function _xfindIndex(f, xf) {
          return new XFindIndex(f, xf);
        });
      }();
      var _xfindLast = function() {
        function XFindLast(f, xf) {
          this.xf = xf;
          this.f = f;
        }
        XFindLast.prototype['@@transducer/init'] = _xfBase.init;
        XFindLast.prototype['@@transducer/result'] = function(result) {
          return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.last));
        };
        XFindLast.prototype['@@transducer/step'] = function(result, input) {
          if (this.f(input)) {
            this.last = input;
          }
          return result;
        };
        return _curry2(function _xfindLast(f, xf) {
          return new XFindLast(f, xf);
        });
      }();
      var _xfindLastIndex = function() {
        function XFindLastIndex(f, xf) {
          this.xf = xf;
          this.f = f;
          this.idx = -1;
          this.lastIdx = -1;
        }
        XFindLastIndex.prototype['@@transducer/init'] = _xfBase.init;
        XFindLastIndex.prototype['@@transducer/result'] = function(result) {
          return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.lastIdx));
        };
        XFindLastIndex.prototype['@@transducer/step'] = function(result, input) {
          this.idx += 1;
          if (this.f(input)) {
            this.lastIdx = this.idx;
          }
          return result;
        };
        return _curry2(function _xfindLastIndex(f, xf) {
          return new XFindLastIndex(f, xf);
        });
      }();
      var _xmap = function() {
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
      }();
      var _xtake = function() {
        function XTake(n, xf) {
          this.xf = xf;
          this.n = n;
        }
        XTake.prototype['@@transducer/init'] = _xfBase.init;
        XTake.prototype['@@transducer/result'] = _xfBase.result;
        XTake.prototype['@@transducer/step'] = function(result, input) {
          this.n -= 1;
          return this.n === 0 ? _reduced(this.xf['@@transducer/step'](result, input)) : this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xtake(n, xf) {
          return new XTake(n, xf);
        });
      }();
      var _xtakeWhile = function() {
        function XTakeWhile(f, xf) {
          this.xf = xf;
          this.f = f;
        }
        XTakeWhile.prototype['@@transducer/init'] = _xfBase.init;
        XTakeWhile.prototype['@@transducer/result'] = _xfBase.result;
        XTakeWhile.prototype['@@transducer/step'] = function(result, input) {
          return this.f(input) ? this.xf['@@transducer/step'](result, input) : _reduced(result);
        };
        return _curry2(function _xtakeWhile(f, xf) {
          return new XTakeWhile(f, xf);
        });
      }();
      var _xwrap = function() {
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
      }();
      var add = _curry2(_add);
      var adjust = _curry3(function(fn, idx, list) {
        if (idx >= list.length || idx < -list.length) {
          return list;
        }
        var start = idx < 0 ? list.length : 0;
        var _idx = start + idx;
        var _list = _concat(list);
        _list[_idx] = fn(list[_idx]);
        return _list;
      });
      var always = _curry1(function always(val) {
        return function() {
          return val;
        };
      });
      var aperture = _curry2(function aperture(n, list) {
        var idx = 0;
        var limit = list.length - (n - 1);
        var acc = new Array(limit >= 0 ? limit : 0);
        while (idx < limit) {
          acc[idx] = _slice(list, idx, idx + n);
          idx += 1;
        }
        return acc;
      });
      var apply = _curry2(function apply(fn, args) {
        return fn.apply(this, args);
      });
      var arity = _curry2(function(n, fn) {
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
            throw new Error('First argument to arity must be a non-negative integer no greater than ten');
        }
      });
      var assoc = _curry3(_assoc);
      var bind = _curry2(function bind(fn, thisObj) {
        return arity(fn.length, function() {
          return fn.apply(thisObj, arguments);
        });
      });
      var both = _curry2(function both(f, g) {
        return function _both() {
          return f.apply(this, arguments) && g.apply(this, arguments);
        };
      });
      var comparator = _curry1(function comparator(pred) {
        return function(a, b) {
          return pred(a, b) ? -1 : pred(b, a) ? 1 : 0;
        };
      });
      var complement = _curry1(_complement);
      var cond = function cond() {
        var pairs = arguments;
        return function() {
          var idx = 0;
          while (idx < pairs.length) {
            if (pairs[idx][0].apply(this, arguments)) {
              return pairs[idx][1].apply(this, arguments);
            }
            idx += 1;
          }
        };
      };
      var containsWith = _curry3(_containsWith);
      var countBy = _curry2(function countBy(fn, list) {
        var counts = {};
        var len = list.length;
        var idx = 0;
        while (idx < len) {
          var key = fn(list[idx]);
          counts[key] = (_has(key, counts) ? counts[key] : 0) + 1;
          idx += 1;
        }
        return counts;
      });
      var createMapEntry = _curry2(_createMapEntry);
      var dec = add(-1);
      var defaultTo = _curry2(function defaultTo(d, v) {
        return v == null ? d : v;
      });
      var differenceWith = _curry3(function differenceWith(pred, first, second) {
        var out = [];
        var idx = 0;
        var firstLen = first.length;
        var containsPred = containsWith(pred);
        while (idx < firstLen) {
          if (!containsPred(first[idx], second) && !containsPred(first[idx], out)) {
            out[out.length] = first[idx];
          }
          idx += 1;
        }
        return out;
      });
      var dissoc = _curry2(_dissoc);
      var divide = _curry2(function divide(a, b) {
        return a / b;
      });
      var either = _curry2(function either(f, g) {
        return function _either() {
          return f.apply(this, arguments) || g.apply(this, arguments);
        };
      });
      var eq = _curry2(_eq);
      var evolve = _curry2(function evolve(transformations, object) {
        var transformation,
            key,
            type,
            result = {};
        for (key in object) {
          transformation = transformations[key];
          type = typeof transformation;
          result[key] = type === 'function' ? transformation(object[key]) : type === 'object' ? evolve(transformations[key], object[key]) : object[key];
        }
        return result;
      });
      var filterIndexed = _curry2(_filterIndexed);
      var forEachIndexed = _curry2(function forEachIndexed(fn, list) {
        var idx = 0,
            len = list.length;
        while (idx < len) {
          fn(list[idx], idx, list);
          idx += 1;
        }
        return list;
      });
      var fromPairs = _curry1(function fromPairs(pairs) {
        var idx = 0,
            len = pairs.length,
            out = {};
        while (idx < len) {
          if (_isArray(pairs[idx]) && pairs[idx].length) {
            out[pairs[idx][0]] = pairs[idx][1];
          }
          idx += 1;
        }
        return out;
      });
      var gt = _curry2(_gt);
      var gte = _curry2(function gte(a, b) {
        return a >= b;
      });
      var has = _curry2(_has);
      var hasIn = _curry2(function(prop, obj) {
        return prop in obj;
      });
      var identical = _curry2(function identical(a, b) {
        if (a === b) {
          return a !== 0 || 1 / a === 1 / b;
        } else {
          return a !== a && b !== b;
        }
      });
      var identity = _curry1(_identity);
      var inc = add(1);
      var insertAll = _curry3(function insertAll(idx, elts, list) {
        idx = idx < list.length && idx >= 0 ? idx : list.length;
        return _concat(_concat(_slice(list, 0, idx), elts), _slice(list, idx));
      });
      var is = _curry2(function is(Ctor, val) {
        return val != null && val.constructor === Ctor || val instanceof Ctor;
      });
      var isArrayLike = _curry1(function isArrayLike(x) {
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
      var isEmpty = _curry1(function isEmpty(list) {
        return Object(list).length === 0;
      });
      var isNil = _curry1(function isNil(x) {
        return x == null;
      });
      var keys = function() {
        var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
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
      }();
      var keysIn = _curry1(function keysIn(obj) {
        var prop,
            ks = [];
        for (prop in obj) {
          ks[ks.length] = prop;
        }
        return ks;
      });
      var length = _curry1(function length(list) {
        return list != null && is(Number, list.length) ? list.length : NaN;
      });
      var lens = _curry2(function lens(get, set) {
        var lns = function(a) {
          return get(a);
        };
        lns.set = _curry2(set);
        lns.map = _curry2(function(fn, a) {
          return set(fn(get(a)), a);
        });
        return lns;
      });
      var lensOn = _curry3(function lensOn(get, set, obj) {
        var lns = function() {
          return get(obj);
        };
        lns.set = set;
        lns.map = function(fn) {
          return set(fn(get(obj)));
        };
        return lns;
      });
      var lt = _curry2(_lt);
      var lte = _curry2(function lte(a, b) {
        return a <= b;
      });
      var mapAccum = _curry3(function mapAccum(fn, acc, list) {
        var idx = 0,
            len = list.length,
            result = [],
            tuple = [acc];
        while (idx < len) {
          tuple = fn(tuple[0], list[idx]);
          result[idx] = tuple[1];
          idx += 1;
        }
        return [tuple[0], result];
      });
      var mapAccumRight = _curry3(function mapAccumRight(fn, acc, list) {
        var idx = list.length - 1,
            result = [],
            tuple = [acc];
        while (idx >= 0) {
          tuple = fn(tuple[0], list[idx]);
          result[idx] = tuple[1];
          idx -= 1;
        }
        return [tuple[0], result];
      });
      var mapIndexed = _curry2(function mapIndexed(fn, list) {
        var idx = 0,
            len = list.length,
            result = [];
        while (idx < len) {
          result[idx] = fn(list[idx], idx, list);
          idx += 1;
        }
        return result;
      });
      var mathMod = _curry2(function mathMod(m, p) {
        if (!_isInteger(m)) {
          return NaN;
        }
        if (!_isInteger(p) || p < 1) {
          return NaN;
        }
        return (m % p + p) % p;
      });
      var maxBy = _curry2(_createMaxMinBy(_gt));
      var minBy = _curry2(_createMaxMinBy(_lt));
      var modulo = _curry2(function modulo(a, b) {
        return a % b;
      });
      var multiply = _curry2(_multiply);
      var nAry = _curry2(function(n, fn) {
        switch (n) {
          case 0:
            return function() {
              return fn.call(this);
            };
          case 1:
            return function(a0) {
              return fn.call(this, a0);
            };
          case 2:
            return function(a0, a1) {
              return fn.call(this, a0, a1);
            };
          case 3:
            return function(a0, a1, a2) {
              return fn.call(this, a0, a1, a2);
            };
          case 4:
            return function(a0, a1, a2, a3) {
              return fn.call(this, a0, a1, a2, a3);
            };
          case 5:
            return function(a0, a1, a2, a3, a4) {
              return fn.call(this, a0, a1, a2, a3, a4);
            };
          case 6:
            return function(a0, a1, a2, a3, a4, a5) {
              return fn.call(this, a0, a1, a2, a3, a4, a5);
            };
          case 7:
            return function(a0, a1, a2, a3, a4, a5, a6) {
              return fn.call(this, a0, a1, a2, a3, a4, a5, a6);
            };
          case 8:
            return function(a0, a1, a2, a3, a4, a5, a6, a7) {
              return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);
            };
          case 9:
            return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
              return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);
            };
          case 10:
            return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
              return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
            };
          default:
            throw new Error('First argument to nAry must be a non-negative integer no greater than ten');
        }
      });
      var negate = _curry1(function negate(n) {
        return -n;
      });
      var not = _curry1(function not(a) {
        return !a;
      });
      var nth = _curry2(_nth);
      var nthArg = _curry1(function nthArg(n) {
        return function() {
          return _nth(n, arguments);
        };
      });
      var nthChar = _curry2(function nthChar(n, str) {
        return str.charAt(n < 0 ? str.length + n : n);
      });
      var nthCharCode = _curry2(function nthCharCode(n, str) {
        return str.charCodeAt(n < 0 ? str.length + n : n);
      });
      var of = _curry1(function of(x) {
        return [x];
      });
      var once = _curry1(function once(fn) {
        var called = false,
            result;
        return function() {
          if (called) {
            return result;
          }
          called = true;
          result = fn.apply(this, arguments);
          return result;
        };
      });
      var path = _curry2(_path);
      var pick = _curry2(function pick(names, obj) {
        var result = {};
        var idx = 0;
        while (idx < names.length) {
          if (names[idx] in obj) {
            result[names[idx]] = obj[names[idx]];
          }
          idx += 1;
        }
        return result;
      });
      var pickAll = _curry2(function pickAll(names, obj) {
        var result = {};
        var idx = 0;
        var len = names.length;
        while (idx < len) {
          var name = names[idx];
          result[name] = obj[name];
          idx += 1;
        }
        return result;
      });
      var pickBy = _curry2(function pickBy(test, obj) {
        var result = {};
        for (var prop in obj) {
          if (test(obj[prop], prop, obj)) {
            result[prop] = obj[prop];
          }
        }
        return result;
      });
      var prepend = _curry2(_prepend);
      var prop = _curry2(function prop(p, obj) {
        return obj[p];
      });
      var propOr = _curry3(function propOr(val, p, obj) {
        return obj != null && _has(p, obj) ? obj[p] : val;
      });
      var props = _curry2(function props(ps, obj) {
        var len = ps.length;
        var out = [];
        var idx = 0;
        while (idx < len) {
          out[idx] = obj[ps[idx]];
          idx += 1;
        }
        return out;
      });
      var range = _curry2(function range(from, to) {
        var result = [];
        var n = from;
        while (n < to) {
          result[result.length] = n;
          n += 1;
        }
        return result;
      });
      var reduceIndexed = _curry3(function reduceIndexed(fn, acc, list) {
        var idx = 0,
            len = list.length;
        while (idx < len) {
          acc = fn(acc, list[idx], idx, list);
          idx += 1;
        }
        return acc;
      });
      var reduceRight = _curry3(function reduceRight(fn, acc, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
          acc = fn(acc, list[idx]);
          idx -= 1;
        }
        return acc;
      });
      var reduceRightIndexed = _curry3(function reduceRightIndexed(fn, acc, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
          acc = fn(acc, list[idx], idx, list);
          idx -= 1;
        }
        return acc;
      });
      var reduced = _curry1(_reduced);
      var rejectIndexed = _curry2(function rejectIndexed(fn, list) {
        return _filterIndexed(_complement(fn), list);
      });
      var remove = _curry3(function remove(start, count, list) {
        return _concat(_slice(list, 0, Math.min(start, list.length)), _slice(list, Math.min(list.length, start + count)));
      });
      var replace = _curry3(function replace(regex, replacement, str) {
        return str.replace(regex, replacement);
      });
      var reverse = _curry1(function reverse(list) {
        return _slice(list).reverse();
      });
      var scan = _curry3(function scan(fn, acc, list) {
        var idx = 0,
            len = list.length,
            result = [acc];
        while (idx < len) {
          acc = fn(acc, list[idx]);
          result[idx + 1] = acc;
          idx += 1;
        }
        return result;
      });
      var sort = _curry2(function sort(comparator, list) {
        return _slice(list).sort(comparator);
      });
      var sortBy = _curry2(function sortBy(fn, list) {
        return _slice(list).sort(function(a, b) {
          var aa = fn(a);
          var bb = fn(b);
          return aa < bb ? -1 : aa > bb ? 1 : 0;
        });
      });
      var strIndexOf = _curry2(function strIndexOf(c, str) {
        return str.indexOf(c);
      });
      var strLastIndexOf = _curry2(function(c, str) {
        return str.lastIndexOf(c);
      });
      var subtract = _curry2(function subtract(a, b) {
        return a - b;
      });
      var tap = _curry2(function tap(fn, x) {
        fn(x);
        return x;
      });
      var test = _curry2(function test(pattern, str) {
        return _cloneRegExp(pattern).test(str);
      });
      var times = _curry2(function times(fn, n) {
        var len = Number(n);
        var list = new Array(len);
        var idx = 0;
        while (idx < len) {
          list[idx] = fn(idx);
          idx += 1;
        }
        return list;
      });
      var toPairs = _curry1(function toPairs(obj) {
        var pairs = [];
        for (var prop in obj) {
          if (_has(prop, obj)) {
            pairs[pairs.length] = [prop, obj[prop]];
          }
        }
        return pairs;
      });
      var toPairsIn = _curry1(function toPairsIn(obj) {
        var pairs = [];
        for (var prop in obj) {
          pairs[pairs.length] = [prop, obj[prop]];
        }
        return pairs;
      });
      var trim = function() {
        var ws = '\t\n\x0B\f\r \xA0\u1680\u180E\u2000\u2001\u2002\u2003' + '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' + '\u2029\uFEFF';
        var zeroWidth = '\u200B';
        var hasProtoTrim = typeof String.prototype.trim === 'function';
        if (!hasProtoTrim || (ws.trim() || !zeroWidth.trim())) {
          return _curry1(function trim(str) {
            var beginRx = new RegExp('^[' + ws + '][' + ws + ']*');
            var endRx = new RegExp('[' + ws + '][' + ws + ']*$');
            return str.replace(beginRx, '').replace(endRx, '');
          });
        } else {
          return _curry1(function trim(str) {
            return str.trim();
          });
        }
      }();
      var type = _curry1(function type(val) {
        return val === null ? 'Null' : val === undefined ? 'Undefined' : Object.prototype.toString.call(val).slice(8, -1);
      });
      var unapply = _curry1(function unapply(fn) {
        return function() {
          return fn(_slice(arguments));
        };
      });
      var unary = _curry1(function unary(fn) {
        return nAry(1, fn);
      });
      var unfold = _curry2(function unfold(fn, seed) {
        var pair = fn(seed);
        var result = [];
        while (pair && pair.length) {
          result[result.length] = pair[0];
          pair = fn(pair[1]);
        }
        return result;
      });
      var uniqWith = _curry2(function uniqWith(pred, list) {
        var idx = 0,
            len = list.length;
        var result = [],
            item;
        while (idx < len) {
          item = list[idx];
          if (!_containsWith(pred, item, result)) {
            result[result.length] = item;
          }
          idx += 1;
        }
        return result;
      });
      var update = _curry3(function(idx, x, list) {
        return adjust(always(x), idx, list);
      });
      var values = _curry1(function values(obj) {
        var props = keys(obj);
        var len = props.length;
        var vals = [];
        var idx = 0;
        while (idx < len) {
          vals[idx] = obj[props[idx]];
          idx += 1;
        }
        return vals;
      });
      var valuesIn = _curry1(function valuesIn(obj) {
        var prop,
            vs = [];
        for (prop in obj) {
          vs[vs.length] = obj[prop];
        }
        return vs;
      });
      var where = _curry2(function where(spec, testObj) {
        for (var prop in spec) {
          if (_has(prop, spec) && !spec[prop](testObj[prop])) {
            return false;
          }
        }
        return true;
      });
      var xprod = _curry2(function xprod(a, b) {
        var idx = 0;
        var ilen = a.length;
        var j;
        var jlen = b.length;
        var result = [];
        while (idx < ilen) {
          j = 0;
          while (j < jlen) {
            result[result.length] = [a[idx], b[j]];
            j += 1;
          }
          idx += 1;
        }
        return result;
      });
      var zip = _curry2(function zip(a, b) {
        var rv = [];
        var idx = 0;
        var len = Math.min(a.length, b.length);
        while (idx < len) {
          rv[idx] = [a[idx], b[idx]];
          idx += 1;
        }
        return rv;
      });
      var zipObj = _curry2(function zipObj(keys, values) {
        var idx = 0,
            len = keys.length,
            out = {};
        while (idx < len) {
          out[keys[idx]] = values[idx];
          idx += 1;
        }
        return out;
      });
      var zipWith = _curry3(function zipWith(fn, a, b) {
        var rv = [],
            idx = 0,
            len = Math.min(a.length, b.length);
        while (idx < len) {
          rv[idx] = fn(a[idx], b[idx]);
          idx += 1;
        }
        return rv;
      });
      var F = always(false);
      var T = always(true);
      var _append = function _append(el, list) {
        return _concat(list, [el]);
      };
      var _assocPath = function _assocPath(path, val, obj) {
        switch (path.length) {
          case 0:
            return obj;
          case 1:
            return _assoc(path[0], val, obj);
          default:
            return _assoc(path[0], _assocPath(_slice(path, 1), val, Object(obj[path[0]])), obj);
        }
      };
      var _baseCopy = function _baseCopy(value, refFrom, refTo) {
        var copy = function copy(copiedValue) {
          var len = refFrom.length;
          var idx = 0;
          while (idx < len) {
            if (value === refFrom[idx]) {
              return refTo[idx];
            }
            idx += 1;
          }
          refFrom[idx + 1] = value;
          refTo[idx + 1] = copiedValue;
          for (var key in value) {
            copiedValue[key] = _baseCopy(value[key], refFrom, refTo);
          }
          return copiedValue;
        };
        switch (type(value)) {
          case 'Object':
            return copy({});
          case 'Array':
            return copy([]);
          case 'Date':
            return new Date(value);
          case 'RegExp':
            return _cloneRegExp(value);
          default:
            return value;
        }
      };
      var _checkForMethod = function _checkForMethod(methodname, fn) {
        return function() {
          var length = arguments.length;
          if (length === 0) {
            return fn();
          }
          var obj = arguments[length - 1];
          return _isArray(obj) || typeof obj[methodname] !== 'function' ? fn.apply(this, arguments) : obj[methodname].apply(obj, _slice(arguments, 0, length - 1));
        };
      };
      var _composeL = function _composeL(innerLens, outerLens) {
        return lens(_compose(innerLens, outerLens), function(x, source) {
          var newInnerValue = innerLens.set(x, outerLens(source));
          return outerLens.set(newInnerValue, source);
        });
      };
      var _composeP = function _composeP(f, g) {
        return function() {
          var context = this;
          var value = g.apply(this, arguments);
          if (_isThenable(value)) {
            return value.then(function(result) {
              return f.call(context, result);
            });
          } else {
            return f.call(this, value);
          }
        };
      };
      var _createComposer = function _createComposer(composeFunction) {
        return function() {
          var fn = arguments[arguments.length - 1];
          var length = fn.length;
          var idx = arguments.length - 2;
          while (idx >= 0) {
            fn = composeFunction(arguments[idx], fn);
            idx -= 1;
          }
          return arity(length, fn);
        };
      };
      var _createMaxMin = function _createMaxMin(comparator, initialVal) {
        return _curry1(function(list) {
          var idx = 0,
              winner = initialVal,
              computed;
          while (idx < list.length) {
            computed = +list[idx];
            if (comparator(computed, winner)) {
              winner = computed;
            }
            idx += 1;
          }
          return winner;
        });
      };
      var _createPartialApplicator = function _createPartialApplicator(concat) {
        return function(fn) {
          var args = _slice(arguments, 1);
          return arity(Math.max(0, fn.length - args.length), function() {
            return fn.apply(this, concat(args, arguments));
          });
        };
      };
      var _curryN = function _curryN(length, received, fn) {
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
          return left <= 0 ? fn.apply(this, combined) : arity(left, _curryN(length, combined, fn));
        };
      };
      var _dispatchable = function _dispatchable(methodname, xf, fn) {
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
      var _dissocPath = function _dissocPath(path, obj) {
        switch (path.length) {
          case 0:
            return obj;
          case 1:
            return _dissoc(path[0], obj);
          default:
            var head = path[0];
            var tail = _slice(path, 1);
            return obj[head] == null ? obj : _assoc(head, _dissocPath(tail, obj[head]), obj);
        }
      };
      var _equals = function _eqDeep(a, b, stackA, stackB) {
        var typeA = type(a);
        if (typeA !== type(b)) {
          return false;
        }
        if (typeA === 'Boolean' || typeA === 'Number' || typeA === 'String') {
          return typeof a === 'object' ? typeof b === 'object' && identical(a.valueOf(), b.valueOf()) : identical(a, b);
        }
        if (identical(a, b)) {
          return true;
        }
        if (typeA === 'RegExp') {
          return a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline && a.sticky === b.sticky && a.unicode === b.unicode;
        }
        if (Object(a) === a) {
          if (typeA === 'Date' && a.getTime() !== b.getTime()) {
            return false;
          }
          var keysA = keys(a);
          if (keysA.length !== keys(b).length) {
            return false;
          }
          var idx = stackA.length - 1;
          while (idx >= 0) {
            if (stackA[idx] === a) {
              return stackB[idx] === b;
            }
            idx -= 1;
          }
          stackA[stackA.length] = a;
          stackB[stackB.length] = b;
          idx = keysA.length - 1;
          while (idx >= 0) {
            var key = keysA[idx];
            if (!_has(key, b) || !_eqDeep(b[key], a[key], stackA, stackB)) {
              return false;
            }
            idx -= 1;
          }
          stackA.pop();
          stackB.pop();
          return true;
        }
        return false;
      };
      var _extend = function _extend(destination, other) {
        var props = keys(other);
        var idx = 0,
            length = props.length;
        while (idx < length) {
          destination[props[idx]] = other[props[idx]];
          idx += 1;
        }
        return destination;
      };
      var _hasMethod = function _hasMethod(methodName, obj) {
        return obj != null && !_isArray(obj) && typeof obj[methodName] === 'function';
      };
      var _makeFlat = function _makeFlat(recursive) {
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
      var _reduce = function() {
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
        var symIterator = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator';
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
      }();
      var _xall = function() {
        function XAll(f, xf) {
          this.xf = xf;
          this.f = f;
          this.all = true;
        }
        XAll.prototype['@@transducer/init'] = _xfBase.init;
        XAll.prototype['@@transducer/result'] = function(result) {
          if (this.all) {
            result = this.xf['@@transducer/step'](result, true);
          }
          return this.xf['@@transducer/result'](result);
        };
        XAll.prototype['@@transducer/step'] = function(result, input) {
          if (!this.f(input)) {
            this.all = false;
            result = _reduced(this.xf['@@transducer/step'](result, false));
          }
          return result;
        };
        return _curry2(function _xall(f, xf) {
          return new XAll(f, xf);
        });
      }();
      var _xany = function() {
        function XAny(f, xf) {
          this.xf = xf;
          this.f = f;
          this.any = false;
        }
        XAny.prototype['@@transducer/init'] = _xfBase.init;
        XAny.prototype['@@transducer/result'] = function(result) {
          if (!this.any) {
            result = this.xf['@@transducer/step'](result, false);
          }
          return this.xf['@@transducer/result'](result);
        };
        XAny.prototype['@@transducer/step'] = function(result, input) {
          if (this.f(input)) {
            this.any = true;
            result = _reduced(this.xf['@@transducer/step'](result, true));
          }
          return result;
        };
        return _curry2(function _xany(f, xf) {
          return new XAny(f, xf);
        });
      }();
      var _xdrop = function() {
        function XDrop(n, xf) {
          this.xf = xf;
          this.n = n;
        }
        XDrop.prototype['@@transducer/init'] = _xfBase.init;
        XDrop.prototype['@@transducer/result'] = _xfBase.result;
        XDrop.prototype.step = function(result, input) {
          if (this.n > 0) {
            this.n -= 1;
            return result;
          }
          return this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xdrop(n, xf) {
          return new XDrop(n, xf);
        });
      }();
      var _xdropWhile = function() {
        function XDropWhile(f, xf) {
          this.xf = xf;
          this.f = f;
        }
        XDropWhile.prototype['@@transducer/init'] = _xfBase.init;
        XDropWhile.prototype['@@transducer/result'] = _xfBase.result;
        XDropWhile.prototype['@@transducer/step'] = function(result, input) {
          if (this.f) {
            if (this.f(input)) {
              return result;
            }
            this.f = null;
          }
          return this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xdropWhile(f, xf) {
          return new XDropWhile(f, xf);
        });
      }();
      var _xgroupBy = function() {
        function XGroupBy(f, xf) {
          this.xf = xf;
          this.f = f;
          this.inputs = {};
        }
        XGroupBy.prototype['@@transducer/init'] = _xfBase.init;
        XGroupBy.prototype['@@transducer/result'] = function(result) {
          var key;
          for (key in this.inputs) {
            if (_has(key, this.inputs)) {
              result = this.xf['@@transducer/step'](result, this.inputs[key]);
              if (result['@@transducer/reduced']) {
                result = result['@@transducer/value'];
                break;
              }
            }
          }
          return this.xf['@@transducer/result'](result);
        };
        XGroupBy.prototype['@@transducer/step'] = function(result, input) {
          var key = this.f(input);
          this.inputs[key] = this.inputs[key] || [key, []];
          this.inputs[key][1] = _append(input, this.inputs[key][1]);
          return result;
        };
        return _curry2(function _xgroupBy(f, xf) {
          return new XGroupBy(f, xf);
        });
      }();
      var all = _curry2(_dispatchable('all', _xall, _all));
      var and = _curry2(function and(a, b) {
        return _hasMethod('and', a) ? a.and(b) : a && b;
      });
      var any = _curry2(_dispatchable('any', _xany, _any));
      var append = _curry2(_append);
      var assocPath = _curry3(_assocPath);
      var binary = _curry1(function binary(fn) {
        return nAry(2, fn);
      });
      var clone = _curry1(function clone(value) {
        return _baseCopy(value, [], []);
      });
      var compose = _createComposer(_compose);
      var composeL = function() {
        var fn = arguments[arguments.length - 1];
        var idx = arguments.length - 2;
        while (idx >= 0) {
          fn = _composeL(arguments[idx], fn);
          idx -= 1;
        }
        return fn;
      };
      var composeP = _createComposer(_composeP);
      var concat = _curry2(function(set1, set2) {
        if (_isArray(set2)) {
          return _concat(set1, set2);
        } else if (_hasMethod('concat', set1)) {
          return set1.concat(set2);
        } else {
          throw new TypeError('can\'t concat ' + typeof set1);
        }
      });
      var curryN = _curry2(function curryN(length, fn) {
        return arity(length, _curryN(length, [], fn));
      });
      var dissocPath = _curry2(_dissocPath);
      var dropWhile = _curry2(_dispatchable('dropWhile', _xdropWhile, function dropWhile(pred, list) {
        var idx = 0,
            len = list.length;
        while (idx < len && pred(list[idx])) {
          idx += 1;
        }
        return _slice(list, idx);
      }));
      var empty = _curry1(function empty(x) {
        return _hasMethod('empty', x) ? x.empty() : [];
      });
      var equals = _curry2(function equals(a, b) {
        return _hasMethod('equals', a) ? a.equals(b) : _hasMethod('equals', b) ? b.equals(a) : _equals(a, b, [], []);
      });
      var filter = _curry2(_dispatchable('filter', _xfilter, _filter));
      var find = _curry2(_dispatchable('find', _xfind, function find(fn, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len) {
          if (fn(list[idx])) {
            return list[idx];
          }
          idx += 1;
        }
      }));
      var findIndex = _curry2(_dispatchable('findIndex', _xfindIndex, function findIndex(fn, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len) {
          if (fn(list[idx])) {
            return idx;
          }
          idx += 1;
        }
        return -1;
      }));
      var findLast = _curry2(_dispatchable('findLast', _xfindLast, function findLast(fn, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
          if (fn(list[idx])) {
            return list[idx];
          }
          idx -= 1;
        }
      }));
      var findLastIndex = _curry2(_dispatchable('findLastIndex', _xfindLastIndex, function findLastIndex(fn, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
          if (fn(list[idx])) {
            return idx;
          }
          idx -= 1;
        }
        return -1;
      }));
      var flatten = _curry1(_makeFlat(true));
      var forEach = _curry2(function forEach(fn, list) {
        return _hasMethod('forEach', list) ? list.forEach(fn) : _forEach(fn, list);
      });
      var functions = _curry1(_functionsWith(keys));
      var functionsIn = _curry1(_functionsWith(keysIn));
      var groupBy = _curry2(_dispatchable('groupBy', _xgroupBy, function groupBy(fn, list) {
        return _reduce(function(acc, elt) {
          var key = fn(elt);
          acc[key] = _append(elt, acc[key] || (acc[key] = []));
          return acc;
        }, {}, list);
      }));
      var head = nth(0);
      var ifElse = _curry3(function ifElse(condition, onTrue, onFalse) {
        return curryN(Math.max(condition.length, onTrue.length, onFalse.length), function _ifElse() {
          return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
        });
      });
      var insert = _curry3(function insert(idx, elt, list) {
        idx = idx < list.length && idx >= 0 ? idx : list.length;
        return _concat(_append(elt, _slice(list, 0, idx)), _slice(list, idx));
      });
      var intersectionWith = _curry3(function intersectionWith(pred, list1, list2) {
        var results = [],
            idx = 0;
        while (idx < list1.length) {
          if (_containsWith(pred, list1[idx], list2)) {
            results[results.length] = list1[idx];
          }
          idx += 1;
        }
        return uniqWith(pred, results);
      });
      var intersperse = _curry2(_checkForMethod('intersperse', function intersperse(separator, list) {
        var out = [];
        var idx = 0;
        var length = list.length;
        while (idx < length) {
          if (idx === length - 1) {
            out.push(list[idx]);
          } else {
            out.push(list[idx], separator);
          }
          idx += 1;
        }
        return out;
      }));
      var invert = _curry1(function invert(obj) {
        var props = keys(obj);
        var len = props.length;
        var idx = 0;
        var out = {};
        while (idx < len) {
          var key = props[idx];
          var val = obj[key];
          var list = _has(val, out) ? out[val] : out[val] = [];
          list[list.length] = key;
          idx += 1;
        }
        return out;
      });
      var invertObj = _curry1(function invertObj(obj) {
        var props = keys(obj);
        var len = props.length;
        var idx = 0;
        var out = {};
        while (idx < len) {
          var key = props[idx];
          out[obj[key]] = key;
          idx += 1;
        }
        return out;
      });
      var invoker = _curry2(function invoker(arity, method) {
        return curryN(arity + 1, function() {
          var target = arguments[arity];
          return target[method].apply(target, _slice(arguments, 0, arity));
        });
      });
      var join = invoker(1, 'join');
      var last = nth(-1);
      var lensIndex = _curry1(function lensIndex(n) {
        return lens(nth(n), update(n));
      });
      var lensProp = _curry1(function lensProp(k) {
        return lens(prop(k), assoc(k));
      });
      var map = _curry2(_dispatchable('map', _xmap, _map));
      var mapObj = _curry2(function mapObject(fn, obj) {
        return _reduce(function(acc, key) {
          acc[key] = fn(obj[key]);
          return acc;
        }, {}, keys(obj));
      });
      var mapObjIndexed = _curry2(function mapObjectIndexed(fn, obj) {
        return _reduce(function(acc, key) {
          acc[key] = fn(obj[key], key, obj);
          return acc;
        }, {}, keys(obj));
      });
      var match = invoker(1, 'match');
      var max = _createMaxMin(_gt, -Infinity);
      var merge = _curry2(function merge(a, b) {
        return _extend(_extend({}, a), b);
      });
      var min = _createMaxMin(_lt, Infinity);
      var none = _curry2(_complement(_dispatchable('any', _xany, _any)));
      var or = _curry2(function or(a, b) {
        return _hasMethod('or', a) ? a.or(b) : a || b;
      });
      var partition = _curry2(function partition(pred, list) {
        return _reduce(function(acc, elt) {
          var xs = acc[pred(elt) ? 0 : 1];
          xs[xs.length] = elt;
          return acc;
        }, [[], []], list);
      });
      var pathEq = _curry3(function pathEq(path, val, obj) {
        return equals(_path(path, obj), val);
      });
      var pipe = function pipe() {
        return compose.apply(this, reverse(arguments));
      };
      var pipeL = compose(apply(composeL), unapply(reverse));
      var pipeP = function pipeP() {
        return composeP.apply(this, reverse(arguments));
      };
      var propEq = _curry3(function propEq(name, val, obj) {
        return equals(obj[name], val);
      });
      var reduce = _curry3(_reduce);
      var reject = _curry2(function reject(fn, list) {
        return filter(_complement(fn), list);
      });
      var repeat = _curry2(function repeat(value, n) {
        return times(always(value), n);
      });
      var slice = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, xs) {
        return Array.prototype.slice.call(xs, fromIndex, toIndex);
      }));
      var split = invoker(1, 'split');
      var substring = slice;
      var substringFrom = substring(__, Infinity);
      var substringTo = substring(0);
      var sum = reduce(_add, 0);
      var tail = _checkForMethod('tail', function(list) {
        return _slice(list, 1);
      });
      var take = _curry2(_dispatchable('take', _xtake, function take(n, xs) {
        return slice(0, n < 0 ? Infinity : n, xs);
      }));
      var takeWhile = _curry2(_dispatchable('takeWhile', _xtakeWhile, function takeWhile(fn, list) {
        var idx = 0,
            len = list.length;
        while (idx < len && fn(list[idx])) {
          idx += 1;
        }
        return _slice(list, 0, idx);
      }));
      var toLower = invoker(0, 'toLowerCase');
      var toUpper = invoker(0, 'toUpperCase');
      var transduce = curryN(4, function(xf, fn, acc, list) {
        return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
      });
      var uncurryN = _curry2(function uncurryN(depth, fn) {
        return curryN(depth, function() {
          var currentDepth = 1;
          var value = fn;
          var idx = 0;
          var endIdx;
          while (currentDepth <= depth && typeof value === 'function') {
            endIdx = currentDepth === depth ? arguments.length : idx + value.length;
            value = value.apply(this, _slice(arguments, idx, endIdx));
            currentDepth += 1;
            idx = endIdx;
          }
          return value;
        });
      });
      var unionWith = _curry3(function unionWith(pred, list1, list2) {
        return uniqWith(pred, _concat(list1, list2));
      });
      var uniq = uniqWith(equals);
      var unnest = _curry1(_makeFlat(false));
      var whereEq = _curry2(function whereEq(spec, testObj) {
        return where(mapObj(equals, spec), testObj);
      });
      var wrap = _curry2(function wrap(fn, wrapper) {
        return curryN(fn.length, function() {
          return wrapper.apply(this, _concat([fn], arguments));
        });
      });
      var _chain = _curry2(function _chain(f, list) {
        return unnest(map(f, list));
      });
      var _flatCat = function() {
        var preservingReduced = function(xf) {
          return {
            '@@transducer/init': _xfBase.init,
            '@@transducer/result': function(result) {
              return xf['@@transducer/result'](result);
            },
            '@@transducer/step': function(result, input) {
              var ret = xf['@@transducer/step'](result, input);
              return ret['@@transducer/reduced'] ? _forceReduced(ret) : ret;
            }
          };
        };
        return function _xcat(xf) {
          var rxf = preservingReduced(xf);
          return {
            '@@transducer/init': _xfBase.init,
            '@@transducer/result': function(result) {
              return rxf['@@transducer/result'](result);
            },
            '@@transducer/step': function(result, input) {
              return !isArrayLike(input) ? _reduce(rxf, result, [input]) : _reduce(rxf, result, input);
            }
          };
        };
      }();
      var _indexOf = function _indexOf(list, item, from) {
        var idx = 0,
            len = list.length;
        if (typeof from === 'number') {
          idx = from < 0 ? Math.max(0, len + from) : from;
        }
        while (idx < len) {
          if (equals(list[idx], item)) {
            return idx;
          }
          idx += 1;
        }
        return -1;
      };
      var _lastIndexOf = function _lastIndexOf(list, item, from) {
        var idx;
        if (typeof from === 'number') {
          idx = from < 0 ? list.length + from : Math.min(list.length - 1, from);
        } else {
          idx = list.length - 1;
        }
        while (idx >= 0) {
          if (equals(list[idx], item)) {
            return idx;
          }
          idx -= 1;
        }
        return -1;
      };
      var _pluck = function _pluck(p, list) {
        return map(prop(p), list);
      };
      var _predicateWrap = function _predicateWrap(predPicker) {
        return function(preds) {
          var predIterator = function() {
            var args = arguments;
            return predPicker(function(predicate) {
              return predicate.apply(null, args);
            }, preds);
          };
          return arguments.length > 1 ? predIterator.apply(null, _slice(arguments, 1)) : arity(max(_pluck('length', preds)), predIterator);
        };
      };
      var _stepCat = function() {
        var _stepCatArray = {
          '@@transducer/init': Array,
          '@@transducer/step': function(xs, x) {
            return _concat(xs, [x]);
          },
          '@@transducer/result': _identity
        };
        var _stepCatString = {
          '@@transducer/init': String,
          '@@transducer/step': _add,
          '@@transducer/result': _identity
        };
        var _stepCatObject = {
          '@@transducer/init': Object,
          '@@transducer/step': function(result, input) {
            return merge(result, isArrayLike(input) ? _createMapEntry(input[0], input[1]) : input);
          },
          '@@transducer/result': _identity
        };
        return function _stepCat(obj) {
          if (_isTransformer(obj)) {
            return obj;
          }
          if (isArrayLike(obj)) {
            return _stepCatArray;
          }
          if (typeof obj === 'string') {
            return _stepCatString;
          }
          if (typeof obj === 'object') {
            return _stepCatObject;
          }
          throw new Error('Cannot create transformer for ' + obj);
        };
      }();
      var _toString = function _toString(x, seen) {
        var recur = function recur(y) {
          var xs = seen.concat([x]);
          return _indexOf(xs, y) >= 0 ? '<Circular>' : _toString(y, xs);
        };
        switch (Object.prototype.toString.call(x)) {
          case '[object Arguments]':
            return '(function() { return arguments; }(' + _map(recur, x).join(', ') + '))';
          case '[object Array]':
            return '[' + _map(recur, x).join(', ') + ']';
          case '[object Boolean]':
            return typeof x === 'object' ? 'new Boolean(' + recur(x.valueOf()) + ')' : x.toString();
          case '[object Date]':
            return 'new Date(' + _quote(_toISOString(x)) + ')';
          case '[object Null]':
            return 'null';
          case '[object Number]':
            return typeof x === 'object' ? 'new Number(' + recur(x.valueOf()) + ')' : 1 / x === -Infinity ? '-0' : x.toString(10);
          case '[object String]':
            return typeof x === 'object' ? 'new String(' + recur(x.valueOf()) + ')' : _quote(x);
          case '[object Undefined]':
            return 'undefined';
          default:
            return typeof x.constructor === 'function' && x.constructor.name !== 'Object' && typeof x.toString === 'function' && x.toString() !== '[object Object]' ? x.toString() : '{' + _map(function(k) {
              return _quote(k) + ': ' + recur(x[k]);
            }, keys(x).sort()).join(', ') + '}';
        }
      };
      var _xchain = _curry2(function _xchain(f, xf) {
        return map(f, _flatCat(xf));
      });
      var addIndex = _curry1(function(fn) {
        return curryN(fn.length, function() {
          var idx = 0;
          var origFn = arguments[0];
          var list = arguments[arguments.length - 1];
          var indexedFn = function() {
            var result = origFn.apply(this, _concat(arguments, [idx, list]));
            idx += 1;
            return result;
          };
          return fn.apply(this, _prepend(indexedFn, _slice(arguments, 1)));
        });
      });
      var ap = _curry2(function ap(fns, vs) {
        return _hasMethod('ap', fns) ? fns.ap(vs) : _reduce(function(acc, fn) {
          return _concat(acc, map(fn, vs));
        }, [], fns);
      });
      var chain = _curry2(_dispatchable('chain', _xchain, _chain));
      var commuteMap = _curry3(function commuteMap(fn, of, list) {
        function consF(acc, ftor) {
          return ap(map(append, fn(ftor)), acc);
        }
        return _reduce(consF, of([]), list);
      });
      var curry = _curry1(function curry(fn) {
        return curryN(fn.length, fn);
      });
      var drop = _curry2(_dispatchable('drop', _xdrop, function drop(n, xs) {
        return slice(Math.max(0, n), Infinity, xs);
      }));
      var dropRepeatsWith = _curry2(_dispatchable('dropRepeatsWith', _xdropRepeatsWith, function dropRepeatsWith(pred, list) {
        var result = [];
        var idx = 1;
        var len = list.length;
        if (len !== 0) {
          result[0] = list[0];
          while (idx < len) {
            if (!pred(last(result), list[idx])) {
              result[result.length] = list[idx];
            }
            idx += 1;
          }
        }
        return result;
      }));
      var eqDeep = equals;
      var eqProps = _curry3(function eqProps(prop, obj1, obj2) {
        return equals(obj1[prop], obj2[prop]);
      });
      var flip = _curry1(function flip(fn) {
        return curry(function(a, b) {
          var args = _slice(arguments);
          args[0] = b;
          args[1] = a;
          return fn.apply(this, args);
        });
      });
      var indexOf = _curry2(function indexOf(target, xs) {
        return _hasMethod('indexOf', xs) ? xs.indexOf(target) : _indexOf(xs, target);
      });
      var init = slice(0, -1);
      var into = _curry3(function into(acc, xf, list) {
        return _isTransformer(acc) ? _reduce(xf(acc), acc['@@transducer/init'](), list) : _reduce(xf(_stepCat(acc)), acc, list);
      });
      var invoke = curry(function invoke(methodName, args, obj) {
        return obj[methodName].apply(obj, args);
      });
      var isSet = _curry1(function isSet(list) {
        var len = list.length;
        var idx = 0;
        while (idx < len) {
          if (_indexOf(list, list[idx], idx + 1) >= 0) {
            return false;
          }
          idx += 1;
        }
        return true;
      });
      var lastIndexOf = _curry2(function lastIndexOf(target, xs) {
        return _hasMethod('lastIndexOf', xs) ? xs.lastIndexOf(target) : _lastIndexOf(xs, target);
      });
      var liftN = _curry2(function liftN(arity, fn) {
        var lifted = curryN(arity, fn);
        return curryN(arity, function() {
          return _reduce(ap, map(lifted, arguments[0]), _slice(arguments, 1));
        });
      });
      var mean = _curry1(function mean(list) {
        return sum(list) / list.length;
      });
      var median = _curry1(function median(list) {
        var len = list.length;
        if (len === 0) {
          return NaN;
        }
        var width = 2 - len % 2;
        var idx = (len - width) / 2;
        return mean(_slice(list).sort(function(a, b) {
          return a < b ? -1 : a > b ? 1 : 0;
        }).slice(idx, idx + width));
      });
      var mergeAll = _curry1(function mergeAll(list) {
        return reduce(merge, {}, list);
      });
      var omit = _curry2(function omit(names, obj) {
        var result = {};
        for (var prop in obj) {
          if (_indexOf(names, prop) < 0) {
            result[prop] = obj[prop];
          }
        }
        return result;
      });
      var partial = curry(_createPartialApplicator(_concat));
      var partialRight = curry(_createPartialApplicator(flip(_concat)));
      var pluck = _curry2(_pluck);
      var product = reduce(_multiply, 1);
      var toString = _curry1(function toString(val) {
        return _toString(val, []);
      });
      var union = _curry2(compose(uniq, _concat));
      var useWith = curry(function useWith(fn) {
        var transformers = _slice(arguments, 1);
        var tlen = transformers.length;
        return curry(arity(tlen, function() {
          var args = [],
              idx = 0;
          while (idx < tlen) {
            args[idx] = transformers[idx](arguments[idx]);
            idx += 1;
          }
          return fn.apply(this, args.concat(_slice(arguments, tlen)));
        }));
      });
      var _contains = function _contains(a, list) {
        return _indexOf(list, a) >= 0;
      };
      var allPass = curry(_predicateWrap(_all));
      var anyPass = curry(_predicateWrap(_any));
      var call = curry(function call(fn) {
        return fn.apply(this, _slice(arguments, 1));
      });
      var commute = commuteMap(map(identity));
      var constructN = _curry2(function constructN(n, Fn) {
        if (n > 10) {
          throw new Error('Constructor with greater than ten arguments');
        }
        if (n === 0) {
          return function() {
            return new Fn();
          };
        }
        return curry(nAry(n, function($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
          switch (arguments.length) {
            case 1:
              return new Fn($0);
            case 2:
              return new Fn($0, $1);
            case 3:
              return new Fn($0, $1, $2);
            case 4:
              return new Fn($0, $1, $2, $3);
            case 5:
              return new Fn($0, $1, $2, $3, $4);
            case 6:
              return new Fn($0, $1, $2, $3, $4, $5);
            case 7:
              return new Fn($0, $1, $2, $3, $4, $5, $6);
            case 8:
              return new Fn($0, $1, $2, $3, $4, $5, $6, $7);
            case 9:
              return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8);
            case 10:
              return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8, $9);
          }
        }));
      });
      var contains = _curry2(_contains);
      var converge = curryN(3, function(after) {
        var fns = _slice(arguments, 1);
        return curryN(max(pluck('length', fns)), function() {
          var args = arguments;
          var context = this;
          return after.apply(context, _map(function(fn) {
            return fn.apply(context, args);
          }, fns));
        });
      });
      var difference = _curry2(function difference(first, second) {
        var out = [];
        var idx = 0;
        var firstLen = first.length;
        while (idx < firstLen) {
          if (!_contains(first[idx], second) && !_contains(first[idx], out)) {
            out[out.length] = first[idx];
          }
          idx += 1;
        }
        return out;
      });
      var dropRepeats = _curry1(_dispatchable('dropRepeats', _xdropRepeatsWith(equals), dropRepeatsWith(equals)));
      var intersection = _curry2(function intersection(list1, list2) {
        return uniq(_filter(flip(_contains)(list1), list2));
      });
      var lift = _curry1(function lift(fn) {
        return liftN(fn.length, fn);
      });
      var memoize = _curry1(function memoize(fn) {
        var cache = {};
        return function() {
          var key = toString(arguments);
          if (!_has(key, cache)) {
            cache[key] = fn.apply(this, arguments);
          }
          return cache[key];
        };
      });
      var project = useWith(_map, pickAll, identity);
      var construct = _curry1(function construct(Fn) {
        return constructN(Fn.length, Fn);
      });
      var R = {
        F: F,
        T: T,
        __: __,
        add: add,
        addIndex: addIndex,
        adjust: adjust,
        all: all,
        allPass: allPass,
        always: always,
        and: and,
        any: any,
        anyPass: anyPass,
        ap: ap,
        aperture: aperture,
        append: append,
        apply: apply,
        arity: arity,
        assoc: assoc,
        assocPath: assocPath,
        binary: binary,
        bind: bind,
        both: both,
        call: call,
        chain: chain,
        clone: clone,
        commute: commute,
        commuteMap: commuteMap,
        comparator: comparator,
        complement: complement,
        compose: compose,
        composeL: composeL,
        composeP: composeP,
        concat: concat,
        cond: cond,
        construct: construct,
        constructN: constructN,
        contains: contains,
        containsWith: containsWith,
        converge: converge,
        countBy: countBy,
        createMapEntry: createMapEntry,
        curry: curry,
        curryN: curryN,
        dec: dec,
        defaultTo: defaultTo,
        difference: difference,
        differenceWith: differenceWith,
        dissoc: dissoc,
        dissocPath: dissocPath,
        divide: divide,
        drop: drop,
        dropRepeats: dropRepeats,
        dropRepeatsWith: dropRepeatsWith,
        dropWhile: dropWhile,
        either: either,
        empty: empty,
        eq: eq,
        eqDeep: eqDeep,
        eqProps: eqProps,
        equals: equals,
        evolve: evolve,
        filter: filter,
        filterIndexed: filterIndexed,
        find: find,
        findIndex: findIndex,
        findLast: findLast,
        findLastIndex: findLastIndex,
        flatten: flatten,
        flip: flip,
        forEach: forEach,
        forEachIndexed: forEachIndexed,
        fromPairs: fromPairs,
        functions: functions,
        functionsIn: functionsIn,
        groupBy: groupBy,
        gt: gt,
        gte: gte,
        has: has,
        hasIn: hasIn,
        head: head,
        identical: identical,
        identity: identity,
        ifElse: ifElse,
        inc: inc,
        indexOf: indexOf,
        init: init,
        insert: insert,
        insertAll: insertAll,
        intersection: intersection,
        intersectionWith: intersectionWith,
        intersperse: intersperse,
        into: into,
        invert: invert,
        invertObj: invertObj,
        invoke: invoke,
        invoker: invoker,
        is: is,
        isArrayLike: isArrayLike,
        isEmpty: isEmpty,
        isNil: isNil,
        isSet: isSet,
        join: join,
        keys: keys,
        keysIn: keysIn,
        last: last,
        lastIndexOf: lastIndexOf,
        length: length,
        lens: lens,
        lensIndex: lensIndex,
        lensOn: lensOn,
        lensProp: lensProp,
        lift: lift,
        liftN: liftN,
        lt: lt,
        lte: lte,
        map: map,
        mapAccum: mapAccum,
        mapAccumRight: mapAccumRight,
        mapIndexed: mapIndexed,
        mapObj: mapObj,
        mapObjIndexed: mapObjIndexed,
        match: match,
        mathMod: mathMod,
        max: max,
        maxBy: maxBy,
        mean: mean,
        median: median,
        memoize: memoize,
        merge: merge,
        mergeAll: mergeAll,
        min: min,
        minBy: minBy,
        modulo: modulo,
        multiply: multiply,
        nAry: nAry,
        negate: negate,
        none: none,
        not: not,
        nth: nth,
        nthArg: nthArg,
        nthChar: nthChar,
        nthCharCode: nthCharCode,
        of: of,
        omit: omit,
        once: once,
        or: or,
        partial: partial,
        partialRight: partialRight,
        partition: partition,
        path: path,
        pathEq: pathEq,
        pick: pick,
        pickAll: pickAll,
        pickBy: pickBy,
        pipe: pipe,
        pipeL: pipeL,
        pipeP: pipeP,
        pluck: pluck,
        prepend: prepend,
        product: product,
        project: project,
        prop: prop,
        propEq: propEq,
        propOr: propOr,
        props: props,
        range: range,
        reduce: reduce,
        reduceIndexed: reduceIndexed,
        reduceRight: reduceRight,
        reduceRightIndexed: reduceRightIndexed,
        reduced: reduced,
        reject: reject,
        rejectIndexed: rejectIndexed,
        remove: remove,
        repeat: repeat,
        replace: replace,
        reverse: reverse,
        scan: scan,
        slice: slice,
        sort: sort,
        sortBy: sortBy,
        split: split,
        strIndexOf: strIndexOf,
        strLastIndexOf: strLastIndexOf,
        substring: substring,
        substringFrom: substringFrom,
        substringTo: substringTo,
        subtract: subtract,
        sum: sum,
        tail: tail,
        take: take,
        takeWhile: takeWhile,
        tap: tap,
        test: test,
        times: times,
        toLower: toLower,
        toPairs: toPairs,
        toPairsIn: toPairsIn,
        toString: toString,
        toUpper: toUpper,
        transduce: transduce,
        trim: trim,
        type: type,
        unapply: unapply,
        unary: unary,
        uncurryN: uncurryN,
        unfold: unfold,
        union: union,
        unionWith: unionWith,
        uniq: uniq,
        uniqWith: uniqWith,
        unnest: unnest,
        update: update,
        useWith: useWith,
        values: values,
        valuesIn: valuesIn,
        where: where,
        whereEq: whereEq,
        wrap: wrap,
        xprod: xprod,
        zip: zip,
        zipObj: zipObj,
        zipWith: zipWith
      };
      if (typeof exports === 'object') {
        module.exports = R;
      } else if (typeof define === 'function' && define.amd) {
        define(function() {
          return R;
        });
      } else {
        this.R = R;
      }
    }.call(this));
  })(require("github:jspm/nodelibs-process@0.1.1.js"));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.15.1.js", ["npm:ramda@0.15.1/dist/ramda.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:ramda@0.15.1/dist/ramda.js");
  global.define = __define;
  return module.exports;
});

System.register("src/org/core/net/ScriptLoader.js", [], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/net/ScriptLoader.js";
  function getPromise() {
    if (System.import) {
      return System.import.bind(System);
    } else {
      return function(url) {
        return Promise.resolve(System.get(url));
      };
    }
  }
  return {
    setters: [],
    execute: function() {
      $__export('default', {load: function(id) {
          return getPromise()(id).then(function(e) {
            return e.default;
          }).catch(console.log.bind(console));
        }});
    }
  };
});

System.register("src/org/core/net/AMDScriptLoader.js", [], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/net/AMDScriptLoader.js";
  return {
    setters: [],
    execute: function() {
      $__export('default', {load: function(id) {
          return new Promise(function(resolve, reject) {
            return window.require([id], resolve.bind(resolve));
          });
        }});
    }
  };
});

System.register("src/org/core/events/EventMap.js", [], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/events/EventMap.js";
  function EventMap() {
    var currentListeners = [];
    return {
      mapListener: function(dispatcher, eventString, listener, scope) {
        var $__0 = this;
        var config;
        var i = currentListeners.length;
        while (i--) {
          config = currentListeners[i];
          if (config.equalTo(dispatcher, eventString, listener)) {
            return;
          }
        }
        var callback = listener;
        config = {
          dispatcher: dispatcher,
          eventString: eventString,
          listener: listener,
          callback: callback,
          scope: scope,
          equalTo: function(dispatcher, eventString, listener) {
            return ($__0.eventString == eventString && $__0.dispatcher == dispatcher && $__0.listener == listener);
          }
        };
        currentListeners.push(config);
        dispatcher.addEventListener(eventString, callback, scope);
      },
      unmapListener: function(dispatcher, eventString, listener) {
        var i = currentListeners.length;
        while (i--) {
          var config = currentListeners[i];
          if (config.equalTo(dispatcher, eventString, listener)) {
            dispatcher.removeEventListener(eventString, config.callback, config.scope);
            currentListeners.splice(i, 1);
            return;
          }
        }
      },
      unmapListeners: function() {
        var eventConfig;
        var dispatcher;
        while (eventConfig = currentListeners.pop()) {
          dispatcher = eventConfig.dispatcher;
          dispatcher.removeEventListener(eventConfig.eventString, eventConfig.callback, eventConfig.scope);
        }
      }
    };
  }
  $__export("default", EventMap);
  return {
    setters: [],
    execute: function() {
    }
  };
});

System.register("src/org/core/events/EventDispatcher.js", [], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/events/EventDispatcher.js";
  var _currentListeners;
  return {
    setters: [],
    execute: function() {
      _currentListeners = {};
      $__export('default', {
        addEventListener: function(type, callback, scope) {
          var listener = {
            type: type,
            callback: callback,
            scope: scope
          };
          if (!_currentListeners[type]) {
            _currentListeners[type] = [];
          }
          _currentListeners[type].push(listener);
          return listener;
        },
        removeEventListener: function(eventName, callback, scope) {
          var listeners = _currentListeners[eventName] || [];
          _currentListeners[eventName] = listeners.filter(function(listener) {
            var sameCB = listener.callback == callback;
            var sameScope = listener.scope == scope;
            return !(sameCB && sameScope);
          });
        },
        removeAllEventListeners: function(eventName) {
          _currentListeners[eventName] = null;
          delete _currentListeners[eventName];
        },
        hasEventListener: function(eventName) {
          return _currentListeners[eventName] && _currentListeners[eventName].length;
        },
        dispatchEvent: function(type, data) {
          var listeners = _currentListeners[type] || [];
          var length = listeners.length,
              l,
              c,
              s;
          for (var i = 0; i < length; i++) {
            l = listeners[i];
            c = l.callback;
            s = l.scope;
            c.call(s, data);
          }
        }
      });
    }
  };
});

System.register("src/org/core/events/Signal.js", [], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/events/Signal.js";
  function Signal() {
    var listenerBoxes = [];
    function registerListener(listener, scope, once) {
      for (var i = 0; i < listenerBoxes.length; i++) {
        if (listenerBoxes[i].listener == listener && listenerBoxes[i].scope == scope) {
          if (listenerBoxes[i].once && !once) {
            throw new Error('You cannot addOnce() then try to add() the same listener ' + 'without removing the relationship first.');
          } else if (once && !listenerBoxes[i].once) {
            throw new Error('You cannot add() then addOnce() the same listener ' + 'without removing the relationship first.');
          }
          return;
        }
      }
      listenerBoxes.push({
        listener: listener,
        scope: scope,
        once: once
      });
    }
    function emit() {
      var len = listenerBoxes.length;
      var listenerBox;
      for (var i = 0; i < len; i++) {
        listenerBox = listenerBoxes[i];
        if (listenerBox.once)
          disconnect(listenerBox.listener, listenerBox.scope);
        listenerBox.listener.apply(listenerBox.scope, arguments);
      }
    }
    var connect = function(slot, scope) {
      return registerListener(slot, scope, false);
    };
    var connectOnce = function(slot, scope) {
      return registerListener(slot, scope, true);
    };
    function disconnect(slot, scope) {
      for (var i = listenerBoxes.length; i--; ) {
        if (listenerBoxes[i].listener == slot && listenerBoxes[i].scope == scope) {
          listenerBoxes.splice(i, 1);
          return;
        }
      }
    }
    function disconnectAll() {
      for (var i = listenerBoxes.length; i--; ) {
        disconnect(listenerBoxes[i].listener, listenerBoxes[i].scope);
      }
    }
    return {
      connect: connect,
      connectOnce: connectOnce,
      disconnect: disconnect,
      disconnectAll: disconnectAll,
      emit: emit
    };
  }
  $__export("default", Signal);
  return {
    setters: [],
    execute: function() {
    }
  };
});

System.register("src/org/core/display/Mediator.js", [], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/display/Mediator.js";
  function Mediator(eventDispatcher, eventMap) {
    return {
      postDestroy: function() {
        return eventMap.unmapListeners();
      },
      addContextListener: function(eventString, listener, scope) {
        return eventMap.mapListener(eventDispatcher, eventString, listener, scope);
      },
      removeContextListener: function(eventString, listener) {
        return eventMap.unmapListener(eventDispatcher, eventString, listener);
      },
      dispatch: function(eventString, data) {
        if (eventDispatcher.hasEventListener(eventString)) {
          eventDispatcher.dispatchEvent(eventString, data);
        }
      },
      initialize: function(node) {
        return node;
      }
    };
  }
  $__export("default", Mediator);
  return {
    setters: [],
    execute: function() {
    }
  };
});

System.register("src/org/core/display/MediatorsBuilder.js", ["src/org/core/robojs.js", "src/org/core/events/Signal.js", "npm:ramda@0.15.1.js"], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/display/MediatorsBuilder.js";
  var RoboJS,
      Signal,
      R;
  function MediatorsBuilder(domWatcher, loader, mediatorHandler, definitions) {
    var onAdded = Signal(),
        onRemoved = Signal();
    var _handleNodesRemoved = R.compose(R.tap(function(mediators) {
      return (mediators.length && onRemoved.emit());
    }), R.forEach(mediatorHandler.destroy), R.flatten());
    var findMediators = R.curryN(2, function(definitions, node) {
      var m = node.getAttribute("data-mediator");
      var def = R.find(R.propEq('id', m), definitions);
      return loader.load(def.mediator).then(mediatorHandler.create(node, def));
    });
    var hasMediator = R.curryN(2, function(definitions, node) {
      var m = node.getAttribute("data-mediator");
      return m && R.containsWith(function(a, b) {
        return a.id === b.id;
      }, {id: m}, definitions);
    });
    var getMediators = R.compose(Promise.all.bind(Promise), R.map(findMediators(definitions)), R.filter(hasMediator(definitions)), R.flatten());
    var _handleNodesAdded = function(nodes) {
      return getMediators(nodes).then(function(mediators) {
        return (mediators.length && onAdded.emit(mediators));
      });
    };
    domWatcher.onAdded.connect(_handleNodesAdded);
    domWatcher.onRemoved.connect(_handleNodesRemoved);
    var _bootstrap = R.compose(getMediators, R.map(function(node) {
      return [node].concat([].slice.call(node.getElementsByTagName("*"), 0));
    }));
    return {
      onAdded: onAdded,
      onRemoved: onRemoved,
      bootstrap: function() {
        return _bootstrap([document.body]);
      }
    };
  }
  $__export("default", MediatorsBuilder);
  return {
    setters: [function($__m) {
      RoboJS = $__m.default;
    }, function($__m) {
      Signal = $__m.default;
    }, function($__m) {
      R = $__m.default;
    }],
    execute: function() {
    }
  };
});

System.register("src/org/core/display/MediatorHandler.js", ["src/org/core/robojs.js", "src/org/core/events/EventDispatcher.js", "src/org/core/events/EventMap.js", "npm:ramda@0.15.1.js"], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/display/MediatorHandler.js";
  var RoboJS,
      EventDispatcher,
      EventMap,
      R;
  return {
    setters: [function($__m) {
      RoboJS = $__m.default;
    }, function($__m) {
      EventDispatcher = $__m.default;
    }, function($__m) {
      EventMap = $__m.default;
    }, function($__m) {
      R = $__m.default;
    }],
    execute: function() {
      $__export('default', {
        create: R.curryN(3, function(node, def, Mediator) {
          var mediatorId = RoboJS.utils.nextUid();
          node.setAttribute('mediatorId', mediatorId);
          var _mediator = Mediator(EventDispatcher, EventMap());
          _mediator.id = mediatorId;
          RoboJS.MEDIATORS_CACHE[mediatorId] = _mediator;
          _mediator.initialize(node);
          return _mediator;
        }),
        destroy: function(node) {
          var mediatorId = node.getAttribute("mediatorId");
          var mediator = RoboJS.MEDIATORS_CACHE[mediatorId];
          if (mediator) {
            mediator.destroy && mediator.destroy(node);
            mediator.postDestroy && mediator.postDestroy();
            mediator.element && (mediator.element = null);
            RoboJS.MEDIATORS_CACHE[mediatorId] = null;
            delete RoboJS.MEDIATORS_CACHE[mediatorId];
            mediator = null;
            return true;
          }
          return false;
        }
      });
    }
  };
});

System.register("src/org/core/display/bootstrap.js", ["src/org/core/display/MediatorsBuilder.js", "src/org/core/display/DomWatcher.js", "src/org/core/net/ScriptLoader.js", "src/org/core/display/MediatorHandler.js"], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/display/bootstrap.js";
  var MediatorsBuilder,
      DomWatcher,
      ScriptLoader,
      MediatorHandler;
  function bootstrap(config) {
    var $__1,
        $__2,
        $__3,
        $__4;
    var $__0 = config,
        definitions = $__0.definitions,
        autoplay = ($__1 = $__0.autoplay) === void 0 ? true : $__1,
        domWatcher = ($__2 = $__0.domWatcher) === void 0 ? DomWatcher() : $__2,
        scriptLoader = ($__3 = $__0.scriptLoader) === void 0 ? ScriptLoader : $__3,
        mediatorHandler = ($__4 = $__0.mediatorHandler) === void 0 ? MediatorHandler : $__4;
    var builder = MediatorsBuilder(domWatcher, scriptLoader, mediatorHandler, definitions);
    return autoplay ? builder.bootstrap() : builder;
  }
  $__export("default", bootstrap);
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
      ;
    }
  };
});

System.register("src/org/core/display/DomWatcher.js", ["src/org/core/events/Signal.js", "npm:ramda@0.15.1.js"], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/display/DomWatcher.js";
  var Signal,
      R;
  function DomWatcher() {
    var onAdded = Signal();
    var onRemoved = Signal();
    function makeChain(prop, emit) {
      return R.compose(R.tap(function(nodes) {
        return (nodes.length && emit(nodes));
      }), R.map(function(node) {
        return [node].concat([].slice.call(node.getElementsByTagName("*"), 0));
      }), R.filter(function(node) {
        return node.getElementsByTagName;
      }), R.flatten(), R.pluck(prop));
    }
    var getAdded = makeChain("addedNodes", onAdded.emit);
    var getRemoved = makeChain("removedNodes", onRemoved.emit);
    var handleMutations = function(mutations) {
      getAdded(mutations);
      getRemoved(mutations);
    };
    var observer = new MutationObserver(handleMutations);
    observer.observe(document.body, {
      attributes: false,
      childList: true,
      characterData: false,
      subtree: true
    });
    return {
      onAdded: onAdded,
      onRemoved: onRemoved
    };
  }
  $__export("default", DomWatcher);
  return {
    setters: [function($__m) {
      Signal = $__m.default;
    }, function($__m) {
      R = $__m.default;
    }],
    execute: function() {
      ;
    }
  };
});

System.register("src/org/core/robojs.js", ["src/org/core/net/ScriptLoader.js", "src/org/core/net/AMDScriptLoader.js", "src/org/core/events/EventMap.js", "src/org/core/events/EventDispatcher.js", "src/org/core/events/Signal.js", "src/org/core/display/DomWatcher.js", "src/org/core/display/Mediator.js", "src/org/core/display/MediatorsBuilder.js", "src/org/core/display/bootstrap.js", "src/org/core/display/MediatorHandler.js"], function($__export) {
  "use strict";
  var __moduleName = "src/org/core/robojs.js";
  var ScriptLoader,
      AMDScriptLoader,
      EventMap,
      EventDispatcher,
      Signal,
      DomWatcher,
      Mediator,
      MediatorsBuilder,
      bootstrap,
      MediatorHandler,
      robojs;
  return {
    setters: [function($__m) {
      ScriptLoader = $__m.default;
    }, function($__m) {
      AMDScriptLoader = $__m.default;
    }, function($__m) {
      EventMap = $__m.default;
    }, function($__m) {
      EventDispatcher = $__m.default;
    }, function($__m) {
      Signal = $__m.default;
    }, function($__m) {
      DomWatcher = $__m.default;
    }, function($__m) {
      Mediator = $__m.default;
    }, function($__m) {
      MediatorsBuilder = $__m.default;
    }, function($__m) {
      bootstrap = $__m.default;
    }, function($__m) {
      MediatorHandler = $__m.default;
    }],
    execute: function() {
      var $__0 = this;
      robojs = {
        MEDIATORS_CACHE: {},
        utils: {
          nextUid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0,
                  v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          },
          flip: function(f) {
            return function() {
              for (var args = [],
                  $__1 = 0; $__1 < arguments.length; $__1++)
                args[$__1] = arguments[$__1];
              return f.apply($__0, args.reverse());
            };
          }
        },
        display: {
          DomWatcher: DomWatcher,
          Mediator: Mediator,
          bootstrap: bootstrap,
          MediatorHandler: MediatorHandler,
          MediatorsBuilder: MediatorsBuilder
        },
        events: {
          EventDispatcher: EventDispatcher,
          EventMap: EventMap,
          Signal: Signal
        },
        net: {
          AMDScriptLoader: AMDScriptLoader,
          ScriptLoader: ScriptLoader
        }
      };
      $__export('default', robojs);
    }
  };
});

})
(function(factory) {
  if (typeof define == 'function' && define.amd)
    define(["robojs"],function(){
      "use strict";
      return factory().default;
    });
  else
    window.robojs=factory().default
});
//# sourceMappingURL=robojs.es6.js.map