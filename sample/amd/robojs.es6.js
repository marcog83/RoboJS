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

  function register(name, deps, declare, execute) {
    if (typeof name != 'string')
      throw "System.register provided no module name";

    var entry;

    // dynamic
    if (typeof declare == 'boolean') {
      entry = {
        declarative: false,
        deps: deps,
        execute: execute,
        executingRequire: declare
      };
    }
    else {
      // ES6 declarative
      entry = {
        declarative: true,
        deps: deps,
        declare: declare
      };
    }

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

    if (!module.setters || !module.execute)
      throw new TypeError("Invalid System.register form for " + entry.name);

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
        if (depEntry.module.exports && depEntry.module.exports.__esModule)
          depExports = depEntry.module.exports;
        else
          depExports = { 'default': depEntry.module.exports, __useDefault: true };
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

    var module = entry.module.exports;

    if (!module || !entry.declarative && module.__esModule !== true)
      module = { 'default': module, __useDefault: true };

    // return the defined module object
    return modules[name] = module;
  };

  return function(mains, declare) {

    var System;
    var System = {
      register: register, 
      get: load, 
      set: function(name, module) {
        modules[name] = module; 
      },
      newModule: function(module) {
        return module;
      },
      global: global 
    };
    System.set('@empty', {});

    declare(System);

    for (var i = 0; i < mains.length; i++)
      load(mains[i]);
  }

})(typeof window != 'undefined' ? window : global)
/* (['mainModule'], function(System) {
  System.register(...);
}); */

(['src/org/core/robojs'], function(System) {

System.register("npm:core-js@0.9.7/library/modules/$.fw", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = function($) {
    $.FW = false;
    $.path = $.core;
    return $;
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.uid", ["npm:core-js@0.9.7/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var sid = 0;
  function uid(key) {
    return 'Symbol(' + key + ')_' + (++sid + Math.random()).toString(36);
  }
  uid.safe = require("npm:core-js@0.9.7/library/modules/$").g.Symbol || uid;
  module.exports = uid;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.string-at", ["npm:core-js@0.9.7/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.9.7/library/modules/$");
  module.exports = function(TO_STRING) {
    return function(that, pos) {
      var s = String($.assertDefined(that)),
          i = $.toInteger(pos),
          l = s.length,
          a,
          b;
      if (i < 0 || i >= l)
        return TO_STRING ? '' : undefined;
      a = s.charCodeAt(i);
      return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff ? TO_STRING ? s.charAt(i) : a : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
    };
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.assert", ["npm:core-js@0.9.7/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.9.7/library/modules/$");
  function assert(condition, msg1, msg2) {
    if (!condition)
      throw TypeError(msg2 ? msg1 + msg2 : msg1);
  }
  assert.def = $.assertDefined;
  assert.fn = function(it) {
    if (!$.isFunction(it))
      throw TypeError(it + ' is not a function!');
    return it;
  };
  assert.obj = function(it) {
    if (!$.isObject(it))
      throw TypeError(it + ' is not an object!');
    return it;
  };
  assert.inst = function(it, Constructor, name) {
    if (!(it instanceof Constructor))
      throw TypeError(name + ": use the 'new' operator!");
    return it;
  };
  module.exports = assert;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.def", ["npm:core-js@0.9.7/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      global = $.g,
      core = $.core,
      isFunction = $.isFunction;
  function ctx(fn, that) {
    return function() {
      return fn.apply(that, arguments);
    };
  }
  $def.F = 1;
  $def.G = 2;
  $def.S = 4;
  $def.P = 8;
  $def.B = 16;
  $def.W = 32;
  function $def(type, name, source) {
    var key,
        own,
        out,
        exp,
        isGlobal = type & $def.G,
        target = isGlobal ? global : type & $def.S ? global[name] : (global[name] || {}).prototype,
        exports = isGlobal ? core : core[name] || (core[name] = {});
    if (isGlobal)
      source = name;
    for (key in source) {
      own = !(type & $def.F) && target && key in target;
      if (own && key in exports)
        continue;
      out = own ? target[key] : source[key];
      if (isGlobal && !isFunction(target[key]))
        exp = source[key];
      else if (type & $def.B && own)
        exp = ctx(out, global);
      else if (type & $def.W && target[key] == out)
        !function(C) {
          exp = function(param) {
            return this instanceof C ? new C(param) : C(param);
          };
          exp.prototype = C.prototype;
        }(out);
      else
        exp = type & $def.P && isFunction(out) ? ctx(Function.call, out) : out;
      $.hide(exports, key, exp);
    }
  }
  module.exports = $def;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.unscope", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      UNSCOPABLES = require("npm:core-js@0.9.7/library/modules/$.wks")('unscopables');
  if ($.FW && !(UNSCOPABLES in []))
    $.hide(Array.prototype, UNSCOPABLES, {});
  module.exports = function(key) {
    if ($.FW)
      [][UNSCOPABLES][key] = true;
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.ctx", ["npm:core-js@0.9.7/library/modules/$.assert"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var assertFunction = require("npm:core-js@0.9.7/library/modules/$.assert").fn;
  module.exports = function(fn, that, length) {
    assertFunction(fn);
    if (~length && that === undefined)
      return fn;
    switch (length) {
      case 1:
        return function(a) {
          return fn.call(that, a);
        };
      case 2:
        return function(a, b) {
          return fn.call(that, a, b);
        };
      case 3:
        return function(a, b, c) {
          return fn.call(that, a, b, c);
        };
    }
    return function() {
      return fn.apply(that, arguments);
    };
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.iter-call", ["npm:core-js@0.9.7/library/modules/$.assert"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var assertObject = require("npm:core-js@0.9.7/library/modules/$.assert").obj;
  function close(iterator) {
    var ret = iterator['return'];
    if (ret !== undefined)
      assertObject(ret.call(iterator));
  }
  function call(iterator, fn, value, entries) {
    try {
      return entries ? fn(assertObject(value)[0], value[1]) : fn(value);
    } catch (e) {
      close(iterator);
      throw e;
    }
  }
  call.close = close;
  module.exports = call;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.set-proto", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.assert", "npm:core-js@0.9.7/library/modules/$.ctx"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      assert = require("npm:core-js@0.9.7/library/modules/$.assert");
  function check(O, proto) {
    assert.obj(O);
    assert(proto === null || $.isObject(proto), proto, ": can't set as prototype!");
  }
  module.exports = {
    set: Object.setPrototypeOf || ('__proto__' in {} ? function(buggy, set) {
      try {
        set = require("npm:core-js@0.9.7/library/modules/$.ctx")(Function.call, $.getDesc(Object.prototype, '__proto__').set, 2);
        set({}, []);
      } catch (e) {
        buggy = true;
      }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy)
          O.__proto__ = proto;
        else
          set(O, proto);
        return O;
      };
    }() : undefined),
    check: check
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.species", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      SPECIES = require("npm:core-js@0.9.7/library/modules/$.wks")('species');
  module.exports = function(C) {
    if ($.DESC && !(SPECIES in C))
      $.setDesc(C, SPECIES, {
        configurable: true,
        get: $.that
      });
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.invoke", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = function(fn, args, that) {
    var un = that === undefined;
    switch (args.length) {
      case 0:
        return un ? fn() : fn.call(that);
      case 1:
        return un ? fn(args[0]) : fn.call(that, args[0]);
      case 2:
        return un ? fn(args[0], args[1]) : fn.call(that, args[0], args[1]);
      case 3:
        return un ? fn(args[0], args[1], args[2]) : fn.call(that, args[0], args[1], args[2]);
      case 4:
        return un ? fn(args[0], args[1], args[2], args[3]) : fn.call(that, args[0], args[1], args[2], args[3]);
      case 5:
        return un ? fn(args[0], args[1], args[2], args[3], args[4]) : fn.call(that, args[0], args[1], args[2], args[3], args[4]);
    }
    return fn.apply(that, args);
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.dom-create", ["npm:core-js@0.9.7/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      document = $.g.document,
      isObject = $.isObject,
      is = isObject(document) && isObject(document.createElement);
  module.exports = function(it) {
    return is ? document.createElement(it) : {};
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:process@0.10.1/browser", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var process = module.exports = {};
  var queue = [];
  var draining = false;
  function drainQueue() {
    if (draining) {
      return ;
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

System.register("npm:core-js@0.9.7/library/modules/$.iter-detect", ["npm:core-js@0.9.7/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var SYMBOL_ITERATOR = require("npm:core-js@0.9.7/library/modules/$.wks")('iterator'),
      SAFE_CLOSING = false;
  try {
    var riter = [7][SYMBOL_ITERATOR]();
    riter['return'] = function() {
      SAFE_CLOSING = true;
    };
    Array.from(riter, function() {
      throw 2;
    });
  } catch (e) {}
  module.exports = function(exec) {
    if (!SAFE_CLOSING)
      return false;
    var safe = false;
    try {
      var arr = [7],
          iter = arr[SYMBOL_ITERATOR]();
      iter.next = function() {
        safe = true;
      };
      arr[SYMBOL_ITERATOR] = function() {
        return iter;
      };
      exec(arr);
    } catch (e) {}
    return safe;
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:ramda@0.13.0/dist/ramda", ["github:jspm/nodelibs-process@0.1.1"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  (function(process) {
    ;
    (function() {
      'use strict';
      var __ = {ramda: 'placeholder'};
      var _add = function _add(a, b) {
        return a + b;
      };
      var _all = function _all(fn, list) {
        var idx = -1;
        while (++idx < list.length) {
          if (!fn(list[idx])) {
            return false;
          }
        }
        return true;
      };
      var _any = function _any(fn, list) {
        var idx = -1;
        while (++idx < list.length) {
          if (fn(list[idx])) {
            return true;
          }
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
        idx = -1;
        while (++idx < len1) {
          result[result.length] = set1[idx];
        }
        idx = -1;
        while (++idx < len2) {
          result[result.length] = set2[idx];
        }
        return result;
      };
      var _containsWith = function _containsWith(pred, x, list) {
        var idx = -1,
            len = list.length;
        while (++idx < len) {
          if (pred(x, list[idx])) {
            return true;
          }
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
            return ;
          }
          var idx = 0;
          var winner = list[idx];
          var computedWinner = valueComputer(winner);
          var computedCurrent;
          while (++idx < list.length) {
            computedCurrent = valueComputer(list[idx]);
            if (comparator(computedCurrent, computedWinner)) {
              computedWinner = computedCurrent;
              winner = list[idx];
            }
          }
          return winner;
        };
      };
      var _curry1 = function _curry1(fn) {
        return function f1(a) {
          if (arguments.length === 0) {
            return f1;
          } else if (a === __) {
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
          } else if (n === 1 && a === __) {
            return f2;
          } else if (n === 1) {
            return _curry1(function(b) {
              return fn(a, b);
            });
          } else if (n === 2 && a === __ && b === __) {
            return f2;
          } else if (n === 2 && a === __) {
            return _curry1(function(a) {
              return fn(a, b);
            });
          } else if (n === 2 && b === __) {
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
          } else if (n === 1 && a === __) {
            return f3;
          } else if (n === 1) {
            return _curry2(function(b, c) {
              return fn(a, b, c);
            });
          } else if (n === 2 && a === __ && b === __) {
            return f3;
          } else if (n === 2 && a === __) {
            return _curry2(function(a, c) {
              return fn(a, b, c);
            });
          } else if (n === 2 && b === __) {
            return _curry2(function(b, c) {
              return fn(a, b, c);
            });
          } else if (n === 2) {
            return _curry1(function(c) {
              return fn(a, b, c);
            });
          } else if (n === 3 && a === __ && b === __ && c === __) {
            return f3;
          } else if (n === 3 && a === __ && b === __) {
            return _curry2(function(a, b) {
              return fn(a, b, c);
            });
          } else if (n === 3 && a === __ && c === __) {
            return _curry2(function(a, c) {
              return fn(a, b, c);
            });
          } else if (n === 3 && b === __ && c === __) {
            return _curry2(function(b, c) {
              return fn(a, b, c);
            });
          } else if (n === 3 && a === __) {
            return _curry1(function(a) {
              return fn(a, b, c);
            });
          } else if (n === 3 && b === __) {
            return _curry1(function(b) {
              return fn(a, b, c);
            });
          } else if (n === 3 && c === __) {
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
      var _filter = function _filter(fn, list) {
        var idx = -1,
            len = list.length,
            result = [];
        while (++idx < len) {
          if (fn(list[idx])) {
            result[result.length] = list[idx];
          }
        }
        return result;
      };
      var _filterIndexed = function _filterIndexed(fn, list) {
        var idx = -1,
            len = list.length,
            result = [];
        while (++idx < len) {
          if (fn(list[idx], idx, list)) {
            result[result.length] = list[idx];
          }
        }
        return result;
      };
      var _forEach = function _forEach(fn, list) {
        var idx = -1,
            len = list.length;
        while (++idx < len) {
          fn(list[idx]);
        }
        return list;
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
      var _indexOf = function _indexOf(list, item, from) {
        var idx = 0,
            len = list.length;
        if (typeof from == 'number') {
          idx = from < 0 ? Math.max(0, len + from) : from;
        }
        while (idx < len) {
          if (list[idx] === item) {
            return idx;
          }
          ++idx;
        }
        return -1;
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
        return typeof obj.step === 'function' && typeof obj.result === 'function';
      };
      var _lastIndexOf = function _lastIndexOf(list, item, from) {
        var idx = list.length;
        if (typeof from == 'number') {
          idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
        }
        while (--idx >= 0) {
          if (list[idx] === item) {
            return idx;
          }
        }
        return -1;
      };
      var _lt = function _lt(a, b) {
        return a < b;
      };
      var _map = function _map(fn, list) {
        var idx = -1,
            len = list.length,
            result = [];
        while (++idx < len) {
          result[idx] = fn(list[idx]);
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
        if (obj == null || paths.length === 0) {
          return ;
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
      var _reduced = function(x) {
        return x && x.__transducers_reduced__ ? x : {
          value: x,
          __transducers_reduced__: true
        };
      };
      var _satisfiesSpec = function _satisfiesSpec(spec, parsedSpec, testObj) {
        if (spec === testObj) {
          return true;
        }
        if (testObj == null) {
          return false;
        }
        parsedSpec.fn = parsedSpec.fn || [];
        parsedSpec.obj = parsedSpec.obj || [];
        var key,
            val,
            idx = -1,
            fnLen = parsedSpec.fn.length,
            j = -1,
            objLen = parsedSpec.obj.length;
        while (++idx < fnLen) {
          key = parsedSpec.fn[idx];
          val = spec[key];
          if (!(key in testObj)) {
            return false;
          }
          if (!val(testObj[key], testObj)) {
            return false;
          }
        }
        while (++j < objLen) {
          key = parsedSpec.obj[j];
          if (spec[key] !== testObj[key]) {
            return false;
          }
        }
        return true;
      };
      var _slice = function _slice(args, from, to) {
        switch (arguments.length) {
          case 1:
            return _slice(args, 0, args.length);
          case 2:
            return _slice(args, from, args.length);
          default:
            var length = Math.max(0, to - from),
                list = [],
                idx = -1;
            while (++idx < length) {
              list[idx] = args[from + idx];
            }
            return list;
        }
      };
      var _xall = function() {
        function XAll(f, xf) {
          this.xf = xf;
          this.f = f;
          this.all = true;
        }
        XAll.prototype.init = function() {
          return this.xf.init();
        };
        XAll.prototype.result = function(result) {
          if (this.all) {
            result = this.xf.step(result, true);
          }
          return this.xf.result(result);
        };
        XAll.prototype.step = function(result, input) {
          if (!this.f(input)) {
            this.all = false;
            result = _reduced(this.xf.step(result, false));
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
        XAny.prototype.init = function() {
          return this.xf.init();
        };
        XAny.prototype.result = function(result) {
          if (!this.any) {
            result = this.xf.step(result, false);
          }
          return this.xf.result(result);
        };
        XAny.prototype.step = function(result, input) {
          if (this.f(input)) {
            this.any = true;
            result = _reduced(this.xf.step(result, true));
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
        XDrop.prototype.init = function() {
          return this.xf.init();
        };
        XDrop.prototype.result = function(result) {
          return this.xf.result(result);
        };
        XDrop.prototype.step = function(result, input) {
          if (this.n > 0) {
            this.n -= 1;
            return result;
          }
          return this.xf.step(result, input);
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
        XDropWhile.prototype.init = function() {
          return this.xf.init();
        };
        XDropWhile.prototype.result = function(result) {
          return this.xf.result(result);
        };
        XDropWhile.prototype.step = function(result, input) {
          if (this.f) {
            if (this.f(input)) {
              return result;
            }
            this.f = null;
          }
          return this.xf.step(result, input);
        };
        return _curry2(function _xdropWhile(f, xf) {
          return new XDropWhile(f, xf);
        });
      }();
      var _xfilter = function() {
        function XFilter(f, xf) {
          this.xf = xf;
          this.f = f;
        }
        XFilter.prototype.init = function() {
          return this.xf.init();
        };
        XFilter.prototype.result = function(result) {
          return this.xf.result(result);
        };
        XFilter.prototype.step = function(result, input) {
          return this.f(input) ? this.xf.step(result, input) : result;
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
        XFind.prototype.init = function() {
          return this.xf.init();
        };
        XFind.prototype.result = function(result) {
          if (!this.found) {
            result = this.xf.step(result, void 0);
          }
          return this.xf.result(result);
        };
        XFind.prototype.step = function(result, input) {
          if (this.f(input)) {
            this.found = true;
            result = _reduced(this.xf.step(result, input));
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
        XFindIndex.prototype.init = function() {
          return this.xf.init();
        };
        XFindIndex.prototype.result = function(result) {
          if (!this.found) {
            result = this.xf.step(result, -1);
          }
          return this.xf.result(result);
        };
        XFindIndex.prototype.step = function(result, input) {
          this.idx += 1;
          if (this.f(input)) {
            this.found = true;
            result = _reduced(this.xf.step(result, this.idx));
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
        XFindLast.prototype.init = function() {
          return this.xf.init();
        };
        XFindLast.prototype.result = function(result) {
          return this.xf.result(this.xf.step(result, this.last));
        };
        XFindLast.prototype.step = function(result, input) {
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
        XFindLastIndex.prototype.init = function() {
          return this.xf.init();
        };
        XFindLastIndex.prototype.result = function(result) {
          return this.xf.result(this.xf.step(result, this.lastIdx));
        };
        XFindLastIndex.prototype.step = function(result, input) {
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
        XMap.prototype.init = function() {
          return this.xf.init();
        };
        XMap.prototype.result = function(result) {
          return this.xf.result(result);
        };
        XMap.prototype.step = function(result, input) {
          return this.xf.step(result, this.f(input));
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
        XTake.prototype.init = function() {
          return this.xf.init();
        };
        XTake.prototype.result = function(result) {
          return this.xf.result(result);
        };
        XTake.prototype.step = function(result, input) {
          this.n -= 1;
          return this.n === 0 ? _reduced(this.xf.step(result, input)) : this.xf.step(result, input);
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
        XTakeWhile.prototype.init = function() {
          return this.xf.init();
        };
        XTakeWhile.prototype.result = function(result) {
          return this.xf.result(result);
        };
        XTakeWhile.prototype.step = function(result, input) {
          return this.f(input) ? this.xf.step(result, input) : _reduced(result);
        };
        return _curry2(function _xtakeWhile(f, xf) {
          return new XTakeWhile(f, xf);
        });
      }();
      var _xwrap = function() {
        function XWrap(fn) {
          this.f = fn;
        }
        XWrap.prototype.init = function() {
          throw new Error('init not implemented on XWrap');
        };
        XWrap.prototype.result = function(acc) {
          return acc;
        };
        XWrap.prototype.step = function(acc, x) {
          return this.f(acc, x);
        };
        return function _xwrap(fn) {
          return new XWrap(fn);
        };
      }();
      var add = _curry2(_add);
      var always = _curry1(function always(val) {
        return function() {
          return val;
        };
      });
      var and = _curry2(function and(a, b) {
        return a && b;
      });
      var aperture = _curry2(function aperture(n, list) {
        var idx = -1;
        var limit = list.length - (n - 1);
        var acc = new Array(limit >= 0 ? limit : 0);
        while (++idx < limit) {
          acc[idx] = _slice(list, idx, idx + n);
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
              void a0;
              return fn.apply(this, arguments);
            };
          case 2:
            return function(a0, a1) {
              void a1;
              return fn.apply(this, arguments);
            };
          case 3:
            return function(a0, a1, a2) {
              void a2;
              return fn.apply(this, arguments);
            };
          case 4:
            return function(a0, a1, a2, a3) {
              void a3;
              return fn.apply(this, arguments);
            };
          case 5:
            return function(a0, a1, a2, a3, a4) {
              void a4;
              return fn.apply(this, arguments);
            };
          case 6:
            return function(a0, a1, a2, a3, a4, a5) {
              void a5;
              return fn.apply(this, arguments);
            };
          case 7:
            return function(a0, a1, a2, a3, a4, a5, a6) {
              void a6;
              return fn.apply(this, arguments);
            };
          case 8:
            return function(a0, a1, a2, a3, a4, a5, a6, a7) {
              void a7;
              return fn.apply(this, arguments);
            };
          case 9:
            return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
              void a8;
              return fn.apply(this, arguments);
            };
          case 10:
            return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
              void a9;
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
          var idx = -1;
          while (++idx < pairs.length) {
            if (pairs[idx][0].apply(this, arguments)) {
              return pairs[idx][1].apply(this, arguments);
            }
          }
        };
      };
      var containsWith = _curry3(_containsWith);
      var countBy = _curry2(function countBy(fn, list) {
        var counts = {};
        var len = list.length;
        var idx = -1;
        while (++idx < len) {
          var key = fn(list[idx]);
          counts[key] = (_has(key, counts) ? counts[key] : 0) + 1;
        }
        return counts;
      });
      var createMapEntry = _curry2(_createMapEntry);
      var curryN = _curry2(function curryN(length, fn) {
        return arity(length, function() {
          var n = arguments.length;
          var shortfall = length - n;
          var idx = n;
          while (--idx >= 0) {
            if (arguments[idx] === __) {
              shortfall += 1;
            }
          }
          if (shortfall <= 0) {
            return fn.apply(this, arguments);
          } else {
            var initialArgs = _slice(arguments);
            return curryN(shortfall, function() {
              var currentArgs = _slice(arguments);
              var combinedArgs = [];
              var idx = -1;
              while (++idx < n) {
                var val = initialArgs[idx];
                combinedArgs[idx] = val === __ ? currentArgs.shift() : val;
              }
              return fn.apply(this, combinedArgs.concat(currentArgs));
            });
          }
        });
      });
      var dec = add(-1);
      var defaultTo = _curry2(function defaultTo(d, v) {
        return v == null ? d : v;
      });
      var differenceWith = _curry3(function differenceWith(pred, first, second) {
        var out = [];
        var idx = -1;
        var firstLen = first.length;
        var containsPred = containsWith(pred);
        while (++idx < firstLen) {
          if (!containsPred(first[idx], second) && !containsPred(first[idx], out)) {
            out[idx] = first[idx];
          }
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
      var eq = _curry2(function eq(a, b) {
        if (a === 0) {
          return 1 / a === 1 / b;
        } else {
          return a === b || a !== a && b !== b;
        }
      });
      var eqProps = _curry3(function eqProps(prop, obj1, obj2) {
        return obj1[prop] === obj2[prop];
      });
      var filterIndexed = _curry2(_filterIndexed);
      var forEach = _curry2(_forEach);
      var forEachIndexed = _curry2(function forEachIndexed(fn, list) {
        var idx = -1,
            len = list.length;
        while (++idx < len) {
          fn(list[idx], idx, list);
        }
        return list;
      });
      var fromPairs = _curry1(function fromPairs(pairs) {
        var idx = -1,
            len = pairs.length,
            out = {};
        while (++idx < len) {
          if (_isArray(pairs[idx]) && pairs[idx].length) {
            out[pairs[idx][0]] = pairs[idx][1];
          }
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
      var identity = _curry1(_identity);
      var ifElse = _curry3(function ifElse(condition, onTrue, onFalse) {
        return curryN(Math.max(condition.length, onTrue.length, onFalse.length), function _ifElse() {
          return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
        });
      });
      var inc = add(1);
      var indexOf = _curry2(function indexOf(target, list) {
        return _indexOf(list, target);
      });
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
      var isNaN = _curry1(function isNaN(x) {
        return typeof x === 'number' && x !== x;
      });
      var isNil = _curry1(function isNil(x) {
        return x == null;
      });
      var isSet = _curry1(function isSet(list) {
        var len = list.length;
        var idx = -1;
        while (++idx < len) {
          if (_indexOf(list, list[idx], idx + 1) >= 0) {
            return false;
          }
        }
        return true;
      });
      var keysIn = _curry1(function keysIn(obj) {
        var prop,
            ks = [];
        for (prop in obj) {
          ks[ks.length] = prop;
        }
        return ks;
      });
      var lastIndexOf = _curry2(function lastIndexOf(target, list) {
        return _lastIndexOf(list, target);
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
        var idx = -1,
            len = list.length,
            result = [],
            tuple = [acc];
        while (++idx < len) {
          tuple = fn(tuple[0], list[idx]);
          result[idx] = tuple[1];
        }
        return [tuple[0], result];
      });
      var mapAccumRight = _curry3(function mapAccumRight(fn, acc, list) {
        var idx = list.length,
            result = [],
            tuple = [acc];
        while (--idx >= 0) {
          tuple = fn(tuple[0], list[idx]);
          result[idx] = tuple[1];
        }
        return [tuple[0], result];
      });
      var mapIndexed = _curry2(function mapIndexed(fn, list) {
        var idx = -1,
            len = list.length,
            result = [];
        while (++idx < len) {
          result[idx] = fn(list[idx], idx, list);
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
      var memoize = function() {
        var repr = function(x) {
          return x + '::' + Object.prototype.toString.call(x);
        };
        var serialize = function(args) {
          return args.length + ':{' + _map(repr, args).join(',') + '}';
        };
        return _curry1(function memoize(fn) {
          var cache = {};
          return function() {
            var key = serialize(arguments);
            if (!_has(key, cache)) {
              cache[key] = fn.apply(this, arguments);
            }
            return cache[key];
          };
        });
      }();
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
      var omit = _curry2(function omit(names, obj) {
        var result = {};
        for (var prop in obj) {
          if (_indexOf(names, prop) < 0) {
            result[prop] = obj[prop];
          }
        }
        return result;
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
      var or = _curry2(function or(a, b) {
        return a || b;
      });
      var path = _curry2(_path);
      var pathEq = _curry3(function pathEq(path, val, obj) {
        return _path(path, obj) === val;
      });
      var pick = _curry2(function pick(names, obj) {
        var result = {};
        for (var prop in obj) {
          if (_indexOf(names, prop) >= 0) {
            result[prop] = obj[prop];
          }
        }
        return result;
      });
      var pickAll = _curry2(function pickAll(names, obj) {
        var result = {};
        var idx = -1;
        var len = names.length;
        while (++idx < len) {
          var name = names[idx];
          result[name] = obj[name];
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
      var propEq = _curry3(function propEq(name, val, obj) {
        return obj[name] === val;
      });
      var propOr = _curry3(function propOr(val, p, obj) {
        return _has(p, obj) ? obj[p] : val;
      });
      var props = _curry2(function props(ps, obj) {
        var len = ps.length;
        var out = [];
        var idx = -1;
        while (++idx < len) {
          out[idx] = obj[ps[idx]];
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
        var idx = -1,
            len = list.length;
        while (++idx < len) {
          acc = fn(acc, list[idx], idx, list);
        }
        return acc;
      });
      var reduceRight = _curry3(function reduceRight(fn, acc, list) {
        var idx = list.length;
        while (--idx >= 0) {
          acc = fn(acc, list[idx]);
        }
        return acc;
      });
      var reduceRightIndexed = _curry3(function reduceRightIndexed(fn, acc, list) {
        var idx = list.length;
        while (--idx >= 0) {
          acc = fn(acc, list[idx], idx, list);
        }
        return acc;
      });
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
            len = list.length + 1,
            result = [acc];
        while (++idx < len) {
          acc = fn(acc, list[idx - 1]);
          result[idx] = acc;
        }
        return result;
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
        var idx = -1,
            len = list.length;
        var result = [],
            item;
        while (++idx < len) {
          item = list[idx];
          if (!_containsWith(pred, item, result)) {
            result[result.length] = item;
          }
        }
        return result;
      });
      var valuesIn = _curry1(function valuesIn(obj) {
        var prop,
            vs = [];
        for (prop in obj) {
          vs[vs.length] = obj[prop];
        }
        return vs;
      });
      var wrap = _curry2(function wrap(fn, wrapper) {
        return curryN(fn.length, function() {
          return wrapper.apply(this, _concat([fn], arguments));
        });
      });
      var xprod = _curry2(function xprod(a, b) {
        var idx = -1;
        var ilen = a.length;
        var j;
        var jlen = b.length;
        var result = [];
        while (++idx < ilen) {
          j = -1;
          while (++j < jlen) {
            result[result.length] = [a[idx], b[j]];
          }
        }
        return result;
      });
      var zip = _curry2(function zip(a, b) {
        var rv = [];
        var idx = -1;
        var len = Math.min(a.length, b.length);
        while (++idx < len) {
          rv[idx] = [a[idx], b[idx]];
        }
        return rv;
      });
      var zipObj = _curry2(function zipObj(keys, values) {
        var idx = -1,
            len = keys.length,
            out = {};
        while (++idx < len) {
          out[keys[idx]] = values[idx];
        }
        return out;
      });
      var zipWith = _curry3(function zipWith(fn, a, b) {
        var rv = [],
            idx = -1,
            len = Math.min(a.length, b.length);
        while (++idx < len) {
          rv[idx] = fn(a[idx], b[idx]);
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
          var idx = -1;
          while (++idx < len) {
            if (value === refFrom[idx]) {
              return refTo[idx];
            }
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
      var _contains = function _contains(a, list) {
        return _indexOf(list, a) >= 0;
      };
      var _createComposer = function _createComposer(composeFunction) {
        return function() {
          var idx = arguments.length - 1;
          var fn = arguments[idx];
          var length = fn.length;
          while (--idx >= 0) {
            fn = composeFunction(arguments[idx], fn);
          }
          return arity(length, fn);
        };
      };
      var _createMaxMin = function _createMaxMin(comparator, initialVal) {
        return _curry1(function(list) {
          var idx = -1,
              winner = initialVal,
              computed;
          while (++idx < list.length) {
            computed = +list[idx];
            if (comparator(computed, winner)) {
              winner = computed;
            }
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
      var _hasMethod = function _hasMethod(methodName, obj) {
        return obj != null && !_isArray(obj) && typeof obj[methodName] === 'function';
      };
      var _makeFlat = function _makeFlat(recursive) {
        return function flatt(list) {
          var value,
              result = [],
              idx = -1,
              j,
              ilen = list.length,
              jlen;
          while (++idx < ilen) {
            if (isArrayLike(list[idx])) {
              value = recursive ? flatt(list[idx]) : list[idx];
              j = -1;
              jlen = value.length;
              while (++j < jlen) {
                result[result.length] = value[j];
              }
            } else {
              result[result.length] = list[idx];
            }
          }
          return result;
        };
      };
      var _pluck = function _pluck(p, list) {
        return _map(prop(p), list);
      };
      var _reduce = function() {
        function _arrayReduce(xf, acc, list) {
          var idx = -1,
              len = list.length;
          while (++idx < len) {
            acc = xf.step(acc, list[idx]);
            if (acc && acc.__transducers_reduced__) {
              acc = acc.value;
              break;
            }
          }
          return xf.result(acc);
        }
        function _iterableReduce(xf, acc, iter) {
          var step = iter.next();
          while (!step.done) {
            acc = xf.step(acc, step.value);
            if (acc && acc.__transducers_reduced__) {
              acc = acc.value;
              break;
            }
            step = iter.next();
          }
          return xf.result(acc);
        }
        function _methodReduce(xf, acc, obj) {
          return xf.result(obj.reduce(bind(xf.step, xf), acc));
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
      var _xgroupBy = function() {
        function XGroupBy(f, xf) {
          this.xf = xf;
          this.f = f;
          this.inputs = {};
        }
        XGroupBy.prototype.init = function() {
          return this.xf.init();
        };
        XGroupBy.prototype.result = function(result) {
          var key;
          for (key in this.inputs) {
            if (_has(key, this.inputs)) {
              result = this.xf.step(result, this.inputs[key]);
              if (result.__transducers_reduced__) {
                result = result.value;
                break;
              }
            }
          }
          return this.xf.result(result);
        };
        XGroupBy.prototype.step = function(result, input) {
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
      var contains = _curry2(_contains);
      var converge = curryN(3, function(after) {
        var fns = _slice(arguments, 1);
        return function() {
          var args = arguments;
          return after.apply(this, _map(function(fn) {
            return fn.apply(this, args);
          }, fns));
        };
      });
      var curry = _curry1(function curry(fn) {
        return curryN(fn.length, fn);
      });
      var difference = _curry2(function difference(first, second) {
        var out = [];
        var idx = -1;
        var firstLen = first.length;
        while (++idx < firstLen) {
          if (!_contains(first[idx], second) && !_contains(first[idx], out)) {
            out[out.length] = first[idx];
          }
        }
        return out;
      });
      var dissocPath = _curry2(_dissocPath);
      var drop = _curry2(_dispatchable('drop', _xdrop, function drop(n, list) {
        return n < list.length ? _slice(list, n) : [];
      }));
      var dropWhile = _curry2(_dispatchable('dropWhile', _xdropWhile, function dropWhile(pred, list) {
        var idx = -1,
            len = list.length;
        while (++idx < len && pred(list[idx])) {}
        return _slice(list, idx);
      }));
      var empty = _curry1(function empty(x) {
        return _hasMethod('empty', x) ? x.empty() : [];
      });
      var filter = _curry2(_dispatchable('filter', _xfilter, _filter));
      var find = _curry2(_dispatchable('find', _xfind, function find(fn, list) {
        var idx = -1;
        var len = list.length;
        while (++idx < len) {
          if (fn(list[idx])) {
            return list[idx];
          }
        }
      }));
      var findIndex = _curry2(_dispatchable('findIndex', _xfindIndex, function findIndex(fn, list) {
        var idx = -1;
        var len = list.length;
        while (++idx < len) {
          if (fn(list[idx])) {
            return idx;
          }
        }
        return -1;
      }));
      var findLast = _curry2(_dispatchable('findLast', _xfindLast, function findLast(fn, list) {
        var idx = list.length;
        while (--idx >= 0) {
          if (fn(list[idx])) {
            return list[idx];
          }
        }
      }));
      var findLastIndex = _curry2(_dispatchable('findLastIndex', _xfindLastIndex, function findLastIndex(fn, list) {
        var idx = list.length;
        while (--idx >= 0) {
          if (fn(list[idx])) {
            return idx;
          }
        }
        return -1;
      }));
      var flatten = _curry1(_makeFlat(true));
      var flip = _curry1(function flip(fn) {
        return curry(function(a, b) {
          var args = _slice(arguments);
          args[0] = b;
          args[1] = a;
          return fn.apply(this, args);
        });
      });
      var func = curry(function func(funcName, obj) {
        return obj[funcName].apply(obj, _slice(arguments, 2));
      });
      var functionsIn = _curry1(_functionsWith(keysIn));
      var groupBy = _curry2(_dispatchable('groupBy', _xgroupBy, function groupBy(fn, list) {
        return _reduce(function(acc, elt) {
          var key = fn(elt);
          acc[key] = _append(elt, acc[key] || (acc[key] = []));
          return acc;
        }, {}, list);
      }));
      var head = nth(0);
      var insert = _curry3(function insert(idx, elt, list) {
        idx = idx < list.length && idx >= 0 ? idx : list.length;
        return _concat(_append(elt, _slice(list, 0, idx)), _slice(list, idx));
      });
      var intersectionWith = _curry3(function intersectionWith(pred, list1, list2) {
        var results = [],
            idx = -1;
        while (++idx < list1.length) {
          if (_containsWith(pred, list1[idx], list2)) {
            results[results.length] = list1[idx];
          }
        }
        return uniqWith(pred, results);
      });
      var invoke = curry(function invoke(methodName, args, obj) {
        return obj[methodName].apply(obj, args);
      });
      var invoker = curry(function invoker(arity, method) {
        var initialArgs = _slice(arguments, 2);
        var len = arity - initialArgs.length;
        return curryN(len + 1, function() {
          var target = arguments[len];
          var args = initialArgs.concat(_slice(arguments, 0, len));
          return target[method].apply(target, args);
        });
      });
      var join = invoker(1, 'join');
      var keys = function() {
        var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
        var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
        return _curry1(function keys(obj) {
          if (Object(obj) !== obj) {
            return [];
          }
          if (Object.keys) {
            return Object.keys(obj);
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
            nIdx = nonEnumerableProps.length;
            while (--nIdx >= 0) {
              prop = nonEnumerableProps[nIdx];
              if (_has(prop, obj) && !_contains(prop, ks)) {
                ks[ks.length] = prop;
              }
            }
          }
          return ks;
        });
      }();
      var last = nth(-1);
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
      var min = _createMaxMin(_lt, Infinity);
      var none = _curry2(_complement(_dispatchable('any', _xany, _any)));
      var partial = curry(_createPartialApplicator(_concat));
      var partialRight = curry(_createPartialApplicator(flip(_concat)));
      var partition = _curry2(function partition(pred, list) {
        return _reduce(function(acc, elt) {
          var xs = acc[pred(elt) ? 0 : 1];
          xs[xs.length] = elt;
          return acc;
        }, [[], []], list);
      });
      var pipe = function pipe() {
        return compose.apply(this, reverse(arguments));
      };
      var pipeP = function pipeP() {
        return composeP.apply(this, reverse(arguments));
      };
      var pluck = _curry2(_pluck);
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
      var sort = _curry2(function sort(comparator, list) {
        return clone(list).sort(comparator);
      });
      var split = invoker(1, 'split');
      var substring = slice;
      var substringFrom = substring(__, Infinity);
      var substringTo = substring(0);
      var sum = reduce(_add, 0);
      var tail = _checkForMethod('tail', function(list) {
        return _slice(list, 1);
      });
      var take = _curry2(_dispatchable('take', _xtake, function take(n, list) {
        return _slice(list, 0, Math.min(n, list.length));
      }));
      var takeWhile = _curry2(_dispatchable('takeWhile', _xtakeWhile, function takeWhile(fn, list) {
        var idx = -1,
            len = list.length;
        while (++idx < len && fn(list[idx])) {}
        return _slice(list, 0, idx);
      }));
      var toLower = invoker(0, 'toLowerCase');
      var toUpper = invoker(0, 'toUpperCase');
      var transduce = curryN(4, function(xf, fn, acc, list) {
        return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
      });
      var unionWith = _curry3(function unionWith(pred, list1, list2) {
        return uniqWith(pred, _concat(list1, list2));
      });
      var uniq = _curry1(function uniq(list) {
        var idx = -1,
            len = list.length;
        var result = [],
            item;
        while (++idx < len) {
          item = list[idx];
          if (!_contains(item, result)) {
            result[result.length] = item;
          }
        }
        return result;
      });
      var unnest = _curry1(_makeFlat(false));
      var useWith = curry(function useWith(fn) {
        var transformers = _slice(arguments, 1);
        var tlen = transformers.length;
        return curry(arity(tlen, function() {
          var args = [],
              idx = -1;
          while (++idx < tlen) {
            args[idx] = transformers[idx](arguments[idx]);
          }
          return fn.apply(this, args.concat(_slice(arguments, tlen)));
        }));
      });
      var values = _curry1(function values(obj) {
        var props = keys(obj);
        var len = props.length;
        var vals = [];
        var idx = -1;
        while (++idx < len) {
          vals[idx] = obj[props[idx]];
        }
        return vals;
      });
      var where = _curry2(function where(spec, testObj) {
        var parsedSpec = groupBy(function(key) {
          return typeof spec[key] === 'function' ? 'fn' : 'obj';
        }, keys(spec));
        return _satisfiesSpec(spec, parsedSpec, testObj);
      });
      var _eqDeep = function _eqDeep(a, b, stackA, stackB) {
        var typeA = type(a);
        if (typeA !== type(b)) {
          return false;
        }
        if (eq(a, b)) {
          return true;
        }
        if (typeA == 'RegExp') {
          return a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline && a.sticky === b.sticky && a.unicode === b.unicode;
        }
        if (Object(a) === a) {
          if (typeA === 'Date' && a.getTime() != b.getTime()) {
            return false;
          }
          var keysA = keys(a);
          if (keysA.length !== keys(b).length) {
            return false;
          }
          var idx = stackA.length;
          while (--idx >= 0) {
            if (stackA[idx] === a) {
              return stackB[idx] === b;
            }
          }
          stackA[stackA.length] = a;
          stackB[stackB.length] = b;
          idx = keysA.length;
          while (--idx >= 0) {
            var key = keysA[idx];
            if (!_has(key, b) || !_eqDeep(b[key], a[key], stackA, stackB)) {
              return false;
            }
          }
          stackA.pop();
          stackB.pop();
          return true;
        }
        return false;
      };
      var _extend = function _extend(destination, other) {
        var props = keys(other);
        var idx = -1,
            length = props.length;
        while (++idx < length) {
          destination[props[idx]] = other[props[idx]];
        }
        return destination;
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
      var allPass = curry(_predicateWrap(_all));
      var anyPass = curry(_predicateWrap(_any));
      var ap = _curry2(function ap(fns, vs) {
        return _hasMethod('ap', fns) ? fns.ap(vs) : _reduce(function(acc, fn) {
          return _concat(acc, map(fn, vs));
        }, [], fns);
      });
      var call = curry(function call(fn) {
        return fn.apply(this, _slice(arguments, 1));
      });
      var chain = _curry2(_checkForMethod('chain', function chain(f, list) {
        return unnest(_map(f, list));
      }));
      var charAt = invoker(1, 'charAt');
      var charCodeAt = invoker(1, 'charCodeAt');
      var commuteMap = _curry3(function commuteMap(fn, of, list) {
        function consF(acc, ftor) {
          return ap(map(append, fn(ftor)), acc);
        }
        return _reduce(consF, of([]), list);
      });
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
      var eqDeep = _curry2(function eqDeep(a, b) {
        return _eqDeep(a, b, [], []);
      });
      var evolve = _curry2(function evolve(transformations, object) {
        return _extend(_extend({}, object), mapObjIndexed(function(fn, key) {
          return fn(object[key]);
        }, transformations));
      });
      var functions = _curry1(_functionsWith(keys));
      var init = slice(0, -1);
      var intersection = _curry2(function intersection(list1, list2) {
        return uniq(_filter(flip(_contains)(list1), list2));
      });
      var invert = _curry1(function invert(obj) {
        var props = keys(obj);
        var len = props.length;
        var idx = -1;
        var out = {};
        while (++idx < len) {
          var key = props[idx];
          var val = obj[key];
          var list = _has(val, out) ? out[val] : out[val] = [];
          list[list.length] = key;
        }
        return out;
      });
      var invertObj = _curry1(function invertObj(obj) {
        var props = keys(obj);
        var len = props.length;
        var idx = -1;
        var out = {};
        while (++idx < len) {
          var key = props[idx];
          out[obj[key]] = key;
        }
        return out;
      });
      var liftN = _curry2(function liftN(arity, fn) {
        var lifted = curryN(arity, fn);
        return curryN(arity, function() {
          return _reduce(ap, map(lifted, arguments[0]), _slice(arguments, 1));
        });
      });
      var merge = _curry2(function merge(a, b) {
        return _extend(_extend({}, a), b);
      });
      var mergeAll = _curry1(function mergeAll(list) {
        return reduce(merge, {}, list);
      });
      var product = reduce(_multiply, 1);
      var project = useWith(_map, pickAll, identity);
      var union = _curry2(compose(uniq, _concat));
      var _stepCat = function() {
        var _stepCatArray = {
          init: Array,
          step: function(xs, x) {
            return _concat(xs, [x]);
          },
          result: _identity
        };
        var _stepCatString = {
          init: String,
          step: _add,
          result: _identity
        };
        var _stepCatObject = {
          init: Object,
          step: function(result, input) {
            return merge(result, isArrayLike(input) ? _createMapEntry(input[0], input[1]) : input);
          },
          result: _identity
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
      var commute = commuteMap(map(identity));
      var construct = _curry1(function construct(Fn) {
        return constructN(Fn.length, Fn);
      });
      var into = _curry3(function into(acc, xf, list) {
        return _isTransformer(acc) ? _reduce(xf(acc), acc.init(), list) : _reduce(xf(_stepCat(acc)), acc, list);
      });
      var lift = _curry1(function lift(fn) {
        return liftN(fn.length, fn);
      });
      var R = {
        F: F,
        T: T,
        __: __,
        add: add,
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
        charAt: charAt,
        charCodeAt: charCodeAt,
        clone: clone,
        commute: commute,
        commuteMap: commuteMap,
        comparator: comparator,
        complement: complement,
        compose: compose,
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
        dropWhile: dropWhile,
        either: either,
        empty: empty,
        eq: eq,
        eqDeep: eqDeep,
        eqProps: eqProps,
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
        func: func,
        functions: functions,
        functionsIn: functionsIn,
        groupBy: groupBy,
        gt: gt,
        gte: gte,
        has: has,
        hasIn: hasIn,
        head: head,
        identity: identity,
        ifElse: ifElse,
        inc: inc,
        indexOf: indexOf,
        init: init,
        insert: insert,
        insertAll: insertAll,
        intersection: intersection,
        intersectionWith: intersectionWith,
        into: into,
        invert: invert,
        invertObj: invertObj,
        invoke: invoke,
        invoker: invoker,
        is: is,
        isArrayLike: isArrayLike,
        isEmpty: isEmpty,
        isNaN: isNaN,
        isNil: isNil,
        isSet: isSet,
        join: join,
        keys: keys,
        keysIn: keysIn,
        last: last,
        lastIndexOf: lastIndexOf,
        length: length,
        lens: lens,
        lensOn: lensOn,
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
        toUpper: toUpper,
        transduce: transduce,
        trim: trim,
        type: type,
        unapply: unapply,
        unary: unary,
        unfold: unfold,
        union: union,
        unionWith: unionWith,
        uniq: uniq,
        uniqWith: uniqWith,
        unnest: unnest,
        useWith: useWith,
        values: values,
        valuesIn: valuesIn,
        where: where,
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
  })(require("github:jspm/nodelibs-process@0.1.1"));
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$", ["npm:core-js@0.9.7/library/modules/$.fw"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var global = typeof self != 'undefined' ? self : Function('return this')(),
      core = {},
      defineProperty = Object.defineProperty,
      hasOwnProperty = {}.hasOwnProperty,
      ceil = Math.ceil,
      floor = Math.floor,
      max = Math.max,
      min = Math.min;
  var DESC = !!function() {
    try {
      return defineProperty({}, 'a', {get: function() {
          return 2;
        }}).a == 2;
    } catch (e) {}
  }();
  var hide = createDefiner(1);
  function toInteger(it) {
    return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
  }
  function desc(bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  }
  function simpleSet(object, key, value) {
    object[key] = value;
    return object;
  }
  function createDefiner(bitmap) {
    return DESC ? function(object, key, value) {
      return $.setDesc(object, key, desc(bitmap, value));
    } : simpleSet;
  }
  function isObject(it) {
    return it !== null && (typeof it == 'object' || typeof it == 'function');
  }
  function isFunction(it) {
    return typeof it == 'function';
  }
  function assertDefined(it) {
    if (it == undefined)
      throw TypeError("Can't call method on  " + it);
    return it;
  }
  var $ = module.exports = require("npm:core-js@0.9.7/library/modules/$.fw")({
    g: global,
    core: core,
    html: global.document && document.documentElement,
    isObject: isObject,
    isFunction: isFunction,
    it: function(it) {
      return it;
    },
    that: function() {
      return this;
    },
    toInteger: toInteger,
    toLength: function(it) {
      return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0;
    },
    toIndex: function(index, length) {
      index = toInteger(index);
      return index < 0 ? max(index + length, 0) : min(index, length);
    },
    has: function(it, key) {
      return hasOwnProperty.call(it, key);
    },
    create: Object.create,
    getProto: Object.getPrototypeOf,
    DESC: DESC,
    desc: desc,
    getDesc: Object.getOwnPropertyDescriptor,
    setDesc: defineProperty,
    setDescs: Object.defineProperties,
    getKeys: Object.keys,
    getNames: Object.getOwnPropertyNames,
    getSymbols: Object.getOwnPropertySymbols,
    assertDefined: assertDefined,
    ES5Object: Object,
    toObject: function(it) {
      return $.ES5Object(assertDefined(it));
    },
    hide: hide,
    def: createDefiner(0),
    set: global.Symbol ? simpleSet : hide,
    mix: function(target, src) {
      for (var key in src)
        hide(target, key, src[key]);
      return target;
    },
    each: [].forEach
  });
  if (typeof __e != 'undefined')
    __e = core;
  if (typeof __g != 'undefined')
    __g = global;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.wks", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.uid"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var global = require("npm:core-js@0.9.7/library/modules/$").g,
      store = {};
  module.exports = function(name) {
    return store[name] || (store[name] = global.Symbol && global.Symbol[name] || require("npm:core-js@0.9.7/library/modules/$.uid").safe('Symbol.' + name));
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.iter", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.cof", "npm:core-js@0.9.7/library/modules/$.assert", "npm:core-js@0.9.7/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      cof = require("npm:core-js@0.9.7/library/modules/$.cof"),
      assertObject = require("npm:core-js@0.9.7/library/modules/$.assert").obj,
      SYMBOL_ITERATOR = require("npm:core-js@0.9.7/library/modules/$.wks")('iterator'),
      FF_ITERATOR = '@@iterator',
      Iterators = {},
      IteratorPrototype = {};
  setIterator(IteratorPrototype, $.that);
  function setIterator(O, value) {
    $.hide(O, SYMBOL_ITERATOR, value);
    if (FF_ITERATOR in [])
      $.hide(O, FF_ITERATOR, value);
  }
  module.exports = {
    BUGGY: 'keys' in [] && !('next' in [].keys()),
    Iterators: Iterators,
    step: function(done, value) {
      return {
        value: value,
        done: !!done
      };
    },
    is: function(it) {
      var O = Object(it),
          Symbol = $.g.Symbol,
          SYM = Symbol && Symbol.iterator || FF_ITERATOR;
      return SYM in O || SYMBOL_ITERATOR in O || $.has(Iterators, cof.classof(O));
    },
    get: function(it) {
      var Symbol = $.g.Symbol,
          ext = it[Symbol && Symbol.iterator || FF_ITERATOR],
          getIter = ext || it[SYMBOL_ITERATOR] || Iterators[cof.classof(it)];
      return assertObject(getIter.call(it));
    },
    set: setIterator,
    create: function(Constructor, NAME, next, proto) {
      Constructor.prototype = $.create(proto || IteratorPrototype, {next: $.desc(1, next)});
      cof.set(Constructor, NAME + ' Iterator');
    }
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.iter-define", ["npm:core-js@0.9.7/library/modules/$.def", "npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.cof", "npm:core-js@0.9.7/library/modules/$.iter", "npm:core-js@0.9.7/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.9.7/library/modules/$.def"),
      $ = require("npm:core-js@0.9.7/library/modules/$"),
      cof = require("npm:core-js@0.9.7/library/modules/$.cof"),
      $iter = require("npm:core-js@0.9.7/library/modules/$.iter"),
      SYMBOL_ITERATOR = require("npm:core-js@0.9.7/library/modules/$.wks")('iterator'),
      FF_ITERATOR = '@@iterator',
      KEYS = 'keys',
      VALUES = 'values',
      Iterators = $iter.Iterators;
  module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE) {
    $iter.create(Constructor, NAME, next);
    function createMethod(kind) {
      function $$(that) {
        return new Constructor(that, kind);
      }
      switch (kind) {
        case KEYS:
          return function keys() {
            return $$(this);
          };
        case VALUES:
          return function values() {
            return $$(this);
          };
      }
      return function entries() {
        return $$(this);
      };
    }
    var TAG = NAME + ' Iterator',
        proto = Base.prototype,
        _native = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT],
        _default = _native || createMethod(DEFAULT),
        methods,
        key;
    if (_native) {
      var IteratorPrototype = $.getProto(_default.call(new Base));
      cof.set(IteratorPrototype, TAG, true);
      if ($.FW && $.has(proto, FF_ITERATOR))
        $iter.set(IteratorPrototype, $.that);
    }
    if ($.FW)
      $iter.set(proto, _default);
    Iterators[NAME] = _default;
    Iterators[TAG] = $.that;
    if (DEFAULT) {
      methods = {
        keys: IS_SET ? _default : createMethod(KEYS),
        values: DEFAULT == VALUES ? _default : createMethod(VALUES),
        entries: DEFAULT != VALUES ? _default : createMethod('entries')
      };
      if (FORCE)
        for (key in methods) {
          if (!(key in proto))
            $.hide(proto, key, methods[key]);
        }
      else
        $def($def.P + $def.F * $iter.BUGGY, NAME, methods);
    }
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/es6.array.iterator", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.unscope", "npm:core-js@0.9.7/library/modules/$.uid", "npm:core-js@0.9.7/library/modules/$.iter", "npm:core-js@0.9.7/library/modules/$.iter-define"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      setUnscope = require("npm:core-js@0.9.7/library/modules/$.unscope"),
      ITER = require("npm:core-js@0.9.7/library/modules/$.uid").safe('iter'),
      $iter = require("npm:core-js@0.9.7/library/modules/$.iter"),
      step = $iter.step,
      Iterators = $iter.Iterators;
  require("npm:core-js@0.9.7/library/modules/$.iter-define")(Array, 'Array', function(iterated, kind) {
    $.set(this, ITER, {
      o: $.toObject(iterated),
      i: 0,
      k: kind
    });
  }, function() {
    var iter = this[ITER],
        O = iter.o,
        kind = iter.k,
        index = iter.i++;
    if (!O || index >= O.length) {
      iter.o = undefined;
      return step(1);
    }
    if (kind == 'keys')
      return step(0, index);
    if (kind == 'values')
      return step(0, O[index]);
    return step(0, [index, O[index]]);
  }, 'values');
  Iterators.Arguments = Iterators.Array;
  setUnscope('keys');
  setUnscope('values');
  setUnscope('entries');
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.for-of", ["npm:core-js@0.9.7/library/modules/$.ctx", "npm:core-js@0.9.7/library/modules/$.iter", "npm:core-js@0.9.7/library/modules/$.iter-call"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var ctx = require("npm:core-js@0.9.7/library/modules/$.ctx"),
      get = require("npm:core-js@0.9.7/library/modules/$.iter").get,
      call = require("npm:core-js@0.9.7/library/modules/$.iter-call");
  module.exports = function(iterable, entries, fn, that) {
    var iterator = get(iterable),
        f = ctx(fn, that, entries ? 2 : 1),
        step;
    while (!(step = iterator.next()).done) {
      if (call(iterator, f, step.value, entries) === false) {
        return call.close(iterator);
      }
    }
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:process@0.10.1", ["npm:process@0.10.1/browser"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:process@0.10.1/browser");
  global.define = __define;
  return module.exports;
});

System.register("npm:ramda@0.13.0", ["npm:ramda@0.13.0/dist/ramda"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:ramda@0.13.0/dist/ramda");
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.cof", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      TAG = require("npm:core-js@0.9.7/library/modules/$.wks")('toStringTag'),
      toString = {}.toString;
  function cof(it) {
    return toString.call(it).slice(8, -1);
  }
  cof.classof = function(it) {
    var O,
        T;
    return it == undefined ? it === undefined ? 'Undefined' : 'Null' : typeof(T = (O = Object(it))[TAG]) == 'string' ? T : cof(O);
  };
  cof.set = function(it, tag, stat) {
    if (it && !$.has(it = stat ? it : it.prototype, TAG))
      $.hide(it, TAG, tag);
  };
  module.exports = cof;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/es6.string.iterator", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.string-at", "npm:core-js@0.9.7/library/modules/$.uid", "npm:core-js@0.9.7/library/modules/$.iter", "npm:core-js@0.9.7/library/modules/$.iter-define"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var set = require("npm:core-js@0.9.7/library/modules/$").set,
      $at = require("npm:core-js@0.9.7/library/modules/$.string-at")(true),
      ITER = require("npm:core-js@0.9.7/library/modules/$.uid").safe('iter'),
      $iter = require("npm:core-js@0.9.7/library/modules/$.iter"),
      step = $iter.step;
  require("npm:core-js@0.9.7/library/modules/$.iter-define")(String, 'String', function(iterated) {
    set(this, ITER, {
      o: String(iterated),
      i: 0
    });
  }, function() {
    var iter = this[ITER],
        O = iter.o,
        index = iter.i,
        point;
    if (index >= O.length)
      return step(1);
    point = $at(O, index);
    iter.i += point.length;
    return step(0, point);
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/web.dom.iterable", ["npm:core-js@0.9.7/library/modules/es6.array.iterator", "npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.iter", "npm:core-js@0.9.7/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  require("npm:core-js@0.9.7/library/modules/es6.array.iterator");
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      Iterators = require("npm:core-js@0.9.7/library/modules/$.iter").Iterators,
      ITERATOR = require("npm:core-js@0.9.7/library/modules/$.wks")('iterator'),
      ArrayValues = Iterators.Array,
      NodeList = $.g.NodeList;
  if ($.FW && NodeList && !(ITERATOR in NodeList.prototype)) {
    $.hide(NodeList.prototype, ITERATOR, ArrayValues);
  }
  Iterators.NodeList = ArrayValues;
  global.define = __define;
  return module.exports;
});

System.register("github:jspm/nodelibs-process@0.1.1/index", ["npm:process@0.10.1"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = System._nodeRequire ? process : require("npm:process@0.10.1");
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/es6.object.to-string", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.cof", "npm:core-js@0.9.7/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.9.7/library/modules/$"),
      cof = require("npm:core-js@0.9.7/library/modules/$.cof"),
      tmp = {};
  tmp[require("npm:core-js@0.9.7/library/modules/$.wks")('toStringTag')] = 'z';
  if ($.FW && cof(tmp) != 'z')
    $.hide(Object.prototype, 'toString', function toString() {
      return '[object ' + cof.classof(this) + ']';
    });
  global.define = __define;
  return module.exports;
});

System.register("github:jspm/nodelibs-process@0.1.1", ["github:jspm/nodelibs-process@0.1.1/index"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = require("github:jspm/nodelibs-process@0.1.1/index");
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/$.task", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.ctx", "npm:core-js@0.9.7/library/modules/$.cof", "npm:core-js@0.9.7/library/modules/$.invoke", "npm:core-js@0.9.7/library/modules/$.dom-create", "github:jspm/nodelibs-process@0.1.1"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var $ = require("npm:core-js@0.9.7/library/modules/$"),
        ctx = require("npm:core-js@0.9.7/library/modules/$.ctx"),
        cof = require("npm:core-js@0.9.7/library/modules/$.cof"),
        invoke = require("npm:core-js@0.9.7/library/modules/$.invoke"),
        cel = require("npm:core-js@0.9.7/library/modules/$.dom-create"),
        global = $.g,
        isFunction = $.isFunction,
        html = $.html,
        process = global.process,
        setTask = global.setImmediate,
        clearTask = global.clearImmediate,
        postMessage = global.postMessage,
        addEventListener = global.addEventListener,
        MessageChannel = global.MessageChannel,
        counter = 0,
        queue = {},
        ONREADYSTATECHANGE = 'onreadystatechange',
        defer,
        channel,
        port;
    function run() {
      var id = +this;
      if ($.has(queue, id)) {
        var fn = queue[id];
        delete queue[id];
        fn();
      }
    }
    function listner(event) {
      run.call(event.data);
    }
    if (!isFunction(setTask) || !isFunction(clearTask)) {
      setTask = function(fn) {
        var args = [],
            i = 1;
        while (arguments.length > i)
          args.push(arguments[i++]);
        queue[++counter] = function() {
          invoke(isFunction(fn) ? fn : Function(fn), args);
        };
        defer(counter);
        return counter;
      };
      clearTask = function(id) {
        delete queue[id];
      };
      if (cof(process) == 'process') {
        defer = function(id) {
          process.nextTick(ctx(run, id, 1));
        };
      } else if (addEventListener && isFunction(postMessage) && !global.importScripts) {
        defer = function(id) {
          postMessage(id, '*');
        };
        addEventListener('message', listner, false);
      } else if (isFunction(MessageChannel)) {
        channel = new MessageChannel;
        port = channel.port2;
        channel.port1.onmessage = listner;
        defer = ctx(port.postMessage, port, 1);
      } else if (ONREADYSTATECHANGE in cel('script')) {
        defer = function(id) {
          html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function() {
            html.removeChild(this);
            run.call(id);
          };
        };
      } else {
        defer = function(id) {
          setTimeout(ctx(run, id, 1), 0);
        };
      }
    }
    module.exports = {
      set: setTask,
      clear: clearTask
    };
  })(require("github:jspm/nodelibs-process@0.1.1"));
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/modules/es6.promise", ["npm:core-js@0.9.7/library/modules/$", "npm:core-js@0.9.7/library/modules/$.ctx", "npm:core-js@0.9.7/library/modules/$.cof", "npm:core-js@0.9.7/library/modules/$.def", "npm:core-js@0.9.7/library/modules/$.assert", "npm:core-js@0.9.7/library/modules/$.for-of", "npm:core-js@0.9.7/library/modules/$.set-proto", "npm:core-js@0.9.7/library/modules/$.species", "npm:core-js@0.9.7/library/modules/$.wks", "npm:core-js@0.9.7/library/modules/$.uid", "npm:core-js@0.9.7/library/modules/$.task", "npm:core-js@0.9.7/library/modules/$.iter-detect", "github:jspm/nodelibs-process@0.1.1"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var $ = require("npm:core-js@0.9.7/library/modules/$"),
        ctx = require("npm:core-js@0.9.7/library/modules/$.ctx"),
        cof = require("npm:core-js@0.9.7/library/modules/$.cof"),
        $def = require("npm:core-js@0.9.7/library/modules/$.def"),
        assert = require("npm:core-js@0.9.7/library/modules/$.assert"),
        forOf = require("npm:core-js@0.9.7/library/modules/$.for-of"),
        setProto = require("npm:core-js@0.9.7/library/modules/$.set-proto").set,
        species = require("npm:core-js@0.9.7/library/modules/$.species"),
        SPECIES = require("npm:core-js@0.9.7/library/modules/$.wks")('species'),
        RECORD = require("npm:core-js@0.9.7/library/modules/$.uid").safe('record'),
        PROMISE = 'Promise',
        global = $.g,
        process = global.process,
        asap = process && process.nextTick || require("npm:core-js@0.9.7/library/modules/$.task").set,
        P = global[PROMISE],
        isFunction = $.isFunction,
        isObject = $.isObject,
        assertFunction = assert.fn,
        assertObject = assert.obj;
    var useNative = function() {
      var test,
          works = false;
      function P2(x) {
        var self = new P(x);
        setProto(self, P2.prototype);
        return self;
      }
      try {
        works = isFunction(P) && isFunction(P.resolve) && P.resolve(test = new P(function() {})) == test;
        setProto(P2, P);
        P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
        if (!(P2.resolve(5).then(function() {}) instanceof P2)) {
          works = false;
        }
      } catch (e) {
        works = false;
      }
      return works;
    }();
    function getConstructor(C) {
      var S = assertObject(C)[SPECIES];
      return S != undefined ? S : C;
    }
    function isThenable(it) {
      var then;
      if (isObject(it))
        then = it.then;
      return isFunction(then) ? then : false;
    }
    function notify(record) {
      var chain = record.c;
      if (chain.length)
        asap(function() {
          var value = record.v,
              ok = record.s == 1,
              i = 0;
          function run(react) {
            var cb = ok ? react.ok : react.fail,
                ret,
                then;
            try {
              if (cb) {
                if (!ok)
                  record.h = true;
                ret = cb === true ? value : cb(value);
                if (ret === react.P) {
                  react.rej(TypeError('Promise-chain cycle'));
                } else if (then = isThenable(ret)) {
                  then.call(ret, react.res, react.rej);
                } else
                  react.res(ret);
              } else
                react.rej(value);
            } catch (err) {
              react.rej(err);
            }
          }
          while (chain.length > i)
            run(chain[i++]);
          chain.length = 0;
        });
    }
    function isUnhandled(promise) {
      var record = promise[RECORD],
          chain = record.a || record.c,
          i = 0,
          react;
      if (record.h)
        return false;
      while (chain.length > i) {
        react = chain[i++];
        if (react.fail || !isUnhandled(react.P))
          return false;
      }
      return true;
    }
    function $reject(value) {
      var record = this,
          promise;
      if (record.d)
        return ;
      record.d = true;
      record = record.r || record;
      record.v = value;
      record.s = 2;
      record.a = record.c.slice();
      setTimeout(function() {
        asap(function() {
          if (isUnhandled(promise = record.p)) {
            if (cof(process) == 'process') {
              process.emit('unhandledRejection', value, promise);
            } else if (global.console && isFunction(console.error)) {
              console.error('Unhandled promise rejection', value);
            }
          }
          record.a = undefined;
        });
      }, 1);
      notify(record);
    }
    function $resolve(value) {
      var record = this,
          then,
          wrapper;
      if (record.d)
        return ;
      record.d = true;
      record = record.r || record;
      try {
        if (then = isThenable(value)) {
          wrapper = {
            r: record,
            d: false
          };
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } else {
          record.v = value;
          record.s = 1;
          notify(record);
        }
      } catch (err) {
        $reject.call(wrapper || {
          r: record,
          d: false
        }, err);
      }
    }
    if (!useNative) {
      P = function Promise(executor) {
        assertFunction(executor);
        var record = {
          p: assert.inst(this, P, PROMISE),
          c: [],
          a: undefined,
          s: 0,
          d: false,
          v: undefined,
          h: false
        };
        $.hide(this, RECORD, record);
        try {
          executor(ctx($resolve, record, 1), ctx($reject, record, 1));
        } catch (err) {
          $reject.call(record, err);
        }
      };
      $.mix(P.prototype, {
        then: function then(onFulfilled, onRejected) {
          var S = assertObject(assertObject(this).constructor)[SPECIES];
          var react = {
            ok: isFunction(onFulfilled) ? onFulfilled : true,
            fail: isFunction(onRejected) ? onRejected : false
          };
          var promise = react.P = new (S != undefined ? S : P)(function(res, rej) {
            react.res = assertFunction(res);
            react.rej = assertFunction(rej);
          });
          var record = this[RECORD];
          record.c.push(react);
          if (record.a)
            record.a.push(react);
          record.s && notify(record);
          return promise;
        },
        'catch': function(onRejected) {
          return this.then(undefined, onRejected);
        }
      });
    }
    $def($def.G + $def.W + $def.F * !useNative, {Promise: P});
    cof.set(P, PROMISE);
    species(P);
    species($.core[PROMISE]);
    $def($def.S + $def.F * !useNative, PROMISE, {
      reject: function reject(r) {
        return new (getConstructor(this))(function(res, rej) {
          rej(r);
        });
      },
      resolve: function resolve(x) {
        return isObject(x) && RECORD in x && $.getProto(x) === this.prototype ? x : new (getConstructor(this))(function(res) {
          res(x);
        });
      }
    });
    $def($def.S + $def.F * !(useNative && require("npm:core-js@0.9.7/library/modules/$.iter-detect")(function(iter) {
      P.all(iter)['catch'](function() {});
    })), PROMISE, {
      all: function all(iterable) {
        var C = getConstructor(this),
            values = [];
        return new C(function(res, rej) {
          forOf(iterable, false, values.push, values);
          var remaining = values.length,
              results = Array(remaining);
          if (remaining)
            $.each.call(values, function(promise, index) {
              C.resolve(promise).then(function(value) {
                results[index] = value;
                --remaining || res(results);
              }, rej);
            });
          else
            res(results);
        });
      },
      race: function race(iterable) {
        var C = getConstructor(this);
        return new C(function(res, rej) {
          forOf(iterable, false, function(promise) {
            C.resolve(promise).then(res, rej);
          });
        });
      }
    });
  })(require("github:jspm/nodelibs-process@0.1.1"));
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.9.7/library/fn/promise", ["npm:core-js@0.9.7/library/modules/es6.object.to-string", "npm:core-js@0.9.7/library/modules/es6.string.iterator", "npm:core-js@0.9.7/library/modules/web.dom.iterable", "npm:core-js@0.9.7/library/modules/es6.promise", "npm:core-js@0.9.7/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  require("npm:core-js@0.9.7/library/modules/es6.object.to-string");
  require("npm:core-js@0.9.7/library/modules/es6.string.iterator");
  require("npm:core-js@0.9.7/library/modules/web.dom.iterable");
  require("npm:core-js@0.9.7/library/modules/es6.promise");
  module.exports = require("npm:core-js@0.9.7/library/modules/$").core.Promise;
  global.define = __define;
  return module.exports;
});

System.register("npm:babel-runtime@5.2.17/core-js/promise", ["npm:core-js@0.9.7/library/fn/promise"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": require("npm:core-js@0.9.7/library/fn/promise"),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

System.register("src/org/core/net/AMDScriptLoader", ["npm:babel-runtime@5.2.17/core-js/promise"], function (_export) {
    var _Promise;

    return {
        setters: [function (_npmBabelRuntime5217CoreJsPromise) {
            _Promise = _npmBabelRuntime5217CoreJsPromise["default"];
        }],
        execute: function () {
            //var System = require('es6-module-loader').System;
            "use strict";

            _export("default", {
                load: function load(id) {
                    return new _Promise(function (resolve, reject) {
                        return window.require([id], resolve.bind(resolve));
                    });
                }
            });
        }
    };
});
System.register("src/org/core/events/EventMap", [], function (_export) {
    _export("default", EventMap);

    function EventMap() {
        var currentListeners = [];
        return {

            mapListener: function mapListener(dispatcher, eventString, listener, scope) {
                var _this = this;

                var config = undefined;
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
                    equalTo: function equalTo(dispatcher, eventString, listener) {
                        return _this.eventString == eventString && _this.dispatcher == dispatcher && _this.listener == listener;
                    }
                };

                currentListeners.push(config);
                dispatcher.addEventListener(eventString, callback, scope);
            },

            unmapListener: function unmapListener(dispatcher, eventString, listener) {

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

            unmapListeners: function unmapListeners() {

                var eventConfig = undefined;
                var dispatcher = undefined;
                while (eventConfig = currentListeners.pop()) {

                    dispatcher = eventConfig.dispatcher;
                    dispatcher.removeEventListener(eventConfig.eventString, eventConfig.callback, eventConfig.scope);
                }
            }
        };
    }

    return {
        setters: [],
        execute: function () {
            "use strict";
        }
    };
});
System.register("src/org/core/events/EventDispatcher", [], function (_export) {
    function EventDispatcher() {

        var _currentListeners = {};

        function addEventListener(type, callback, scope) {
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
        }

        function removeEventListener(eventName, callback, scope) {
            var listeners = _currentListeners[eventName] || [];
            _currentListeners[eventName] = listeners.filter(function (listener) {
                var sameCB = listener.callback == callback;
                var sameScope = listener.scope == scope;
                return !(sameCB && sameScope);
            });
        }

        var removeAllEventListeners = function removeAllEventListeners(eventName) {
            return _currentListeners[eventName] = null;
        };
        var hasEventListener = function hasEventListener(eventName) {
            return _currentListeners[eventName] && _currentListeners[eventName].length;
        };

        function dispatchEvent(type, data) {
            var listeners = _currentListeners[type] || [];
            var length = listeners.length,
                l = undefined,
                c = undefined,
                s = undefined;
            for (var i = 0; i < length; i++) {
                l = listeners[i];
                c = l.callback;
                s = l.scope;
                c.call(s, data);
            }
        }
        return {
            addEventListener: addEventListener,
            removeEventListener: removeEventListener,
            removeAllEventListeners: removeAllEventListeners,
            hasEventListener: hasEventListener,
            dispatchEvent: dispatchEvent
        };
    }return {
        setters: [],
        execute: function () {
            "use strict";

            ;

            _export("default", EventDispatcher());
        }
    };
});
System.register('src/org/core/events/Signal', [], function (_export) {
    _export('default', Signal);

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

            listenerBoxes.push({ listener: listener, scope: scope, once: once });
        }

        function emit() {

            // var listenerBoxes = listenerBoxes;
            var len = listenerBoxes.length;
            var listenerBox = undefined;

            for (var i = 0; i < len; i++) {
                listenerBox = listenerBoxes[i];
                if (listenerBox.once) disconnect(listenerBox.listener, listenerBox.scope);

                listenerBox.listener.apply(listenerBox.scope, arguments);
            }
        }

        var connect = function connect(slot, scope) {
            return registerListener(slot, scope, false);
        };

        var connectOnce = function connectOnce(slot, scope) {
            return registerListener(slot, scope, true);
        };

        function disconnect(slot, scope) {

            for (var i = listenerBoxes.length; i--;) {
                if (listenerBoxes[i].listener == slot && listenerBoxes[i].scope == scope) {
                    listenerBoxes.splice(i, 1);
                    return;
                }
            }
        }

        function disconnectAll() {

            for (var i = listenerBoxes.length; i--;) {
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

    return {
        setters: [],
        execute: function () {
            'use strict';
        }
    };
});
System.register("src/org/core/display/Mediator", [], function (_export) {
    _export("default", Mediator);

    function Mediator(eventDispatcher, eventMap) {

        var element = undefined;
        var postDestroy = function postDestroy() {
            return eventMap.unmapListeners();
        };
        var addContextListener = function addContextListener(eventString, listener, scope) {
            return eventMap.mapListener(eventDispatcher, eventString, listener, scope);
        };
        var removeContextListener = function removeContextListener(eventString, listener) {
            return eventMap.unmapListener(eventDispatcher, eventString, listener);
        };
        var dispatch = function dispatch(eventString, data) {
            if (eventDispatcher.hasEventListener(eventString)) {
                eventDispatcher.dispatchEvent(eventString, data);
            }
        };
        var initialize = function initialize(node) {
            return element = node;
        };
        return {

            postDestroy: postDestroy,
            addContextListener: addContextListener,
            removeContextListener: removeContextListener,
            dispatch: dispatch,
            initialize: initialize

        };
    }

    return {
        setters: [],
        execute: function () {
            "use strict";
        }
    };
});
System.register("src/org/core/display/MediatorsBuilder", ["npm:babel-runtime@5.2.17/core-js/promise", "src/org/core/robojs", "src/org/core/events/Signal", "npm:ramda@0.13.0"], function (_export) {
    var _Promise, RoboJS, Signal, R;

    function MediatorsBuilder(domWatcher, loader, mediatorHandler, definitions) {

        var onAdded = Signal(),
            onRemoved = Signal(),
            _emitAddedSignal = function _emitAddedSignal(mediators) {
            if (mediators.length) onAdded.emit(mediators);
        },
            _filterDefinitions = R.curryN(2, function (node, def) {
            return node.getAttribute("data-mediator") == def.id;
        }),
            _createMediator = R.curryN(2, function (node, def) {
            return loader.load(def.mediator).then(mediatorHandler.create(node, def));
        }),
            _reduceNodes = function _reduceNodes(result, node) {
            if (!node || !node.getElementsByTagName) return result;
            var n = [].slice.call(node.getElementsByTagName("*"), 0);
            n.unshift(node);
            return result.concat(n);
        },
            _destroyMediator = function _destroyMediator(node) {
            var mediator = mediatorHandler.destroy(node);
            mediator && onRemoved.emit(mediator);
        },
            _handleNodesRemoved = R.compose(R.forEach(_destroyMediator), R.reduce(_reduceNodes, []));

        var _findMediators = function _findMediators(result, node) {

            var _composedFindMediator = R.compose(R.map(_createMediator(node)), R.filter(_filterDefinitions(node)));
            return result.concat(_composedFindMediator(definitions));
        };

        var _promiseReduce = R.compose(R.reduce(_findMediators, []), R.reduce(_reduceNodes, []));
        var getMediators = function getMediators(target) {
            return _Promise.all(_promiseReduce(target));
        };
        var _handleNodesAdded = function _handleNodesAdded(nodes) {
            return getMediators(nodes).then(_emitAddedSignal);
        };

        domWatcher.onAdded.connect(_handleNodesAdded);
        domWatcher.onRemoved.connect(_handleNodesRemoved);

        return {
            onAdded: onAdded,
            onRemoved: onRemoved,
            bootstrap: function bootstrap() {
                return getMediators([document.body]);
            }
        };
    }

    return {
        setters: [function (_npmBabelRuntime5217CoreJsPromise) {
            _Promise = _npmBabelRuntime5217CoreJsPromise["default"];
        }, function (_srcOrgCoreRobojs) {
            RoboJS = _srcOrgCoreRobojs["default"];
        }, function (_srcOrgCoreEventsSignal) {
            Signal = _srcOrgCoreEventsSignal["default"];
        }, function (_npmRamda0130) {
            R = _npmRamda0130["default"];
        }],
        execute: function () {
            "use strict";

            _export("default", MediatorsBuilder);
        }
    };
});
System.register("src/org/core/display/MediatorHandler", ["src/org/core/robojs", "src/org/core/events/EventDispatcher", "src/org/core/events/EventMap", "npm:ramda@0.13.0"], function (_export) {
    var RoboJS, EventDispatcher, EventMap, R;
    return {
        setters: [function (_srcOrgCoreRobojs) {
            RoboJS = _srcOrgCoreRobojs["default"];
        }, function (_srcOrgCoreEventsEventDispatcher) {
            EventDispatcher = _srcOrgCoreEventsEventDispatcher["default"];
        }, function (_srcOrgCoreEventsEventMap) {
            EventMap = _srcOrgCoreEventsEventMap["default"];
        }, function (_npmRamda0130) {
            R = _npmRamda0130["default"];
        }],
        execute: function () {
            /**
             * Created by marco.gobbi on 21/01/2015.
             */
            "use strict";

            _export("default", {
                create: R.curryN(3, function (node, def, Mediator) {
                    var mediatorId = RoboJS.utils.nextUid();
                    //node.dataset = node.dataset || {};
                    node.setAttribute("mediatorId", mediatorId);
                    //node.dataset.mediatorId = mediatorId;
                    //
                    var _mediator = Mediator(EventDispatcher, EventMap());
                    _mediator.id = mediatorId;
                    RoboJS.MEDIATORS_CACHE[mediatorId] = _mediator;
                    _mediator.initialize(node);
                    return _mediator;
                }),
                destroy: function destroy(node) {

                    var mediatorId = node.getAttribute("mediatorId"); //&& node.dataset.mediatorId;
                    var mediator = RoboJS.MEDIATORS_CACHE[mediatorId];
                    if (mediator) {
                        mediator.destroy && mediator.destroy();
                        mediator.postDestroy && mediator.postDestroy();
                        mediator.element && (mediator.element = null);
                        RoboJS.MEDIATORS_CACHE[mediatorId] = null;
                        mediator = null;
                    }
                }
            });
        }
    };
});
System.register("src/org/core/display/bootstrap", ["src/org/core/display/MediatorsBuilder", "src/org/core/display/DomWatcher", "src/org/core/net/ScriptLoader", "src/org/core/display/MediatorHandler"], function (_export) {
    var MediatorsBuilder, DomWatcher, ScriptLoader, MediatorHandler;

    _export("default", bootstrap);

    function bootstrap(config) {
        var definitions = config.definitions;
        var _config$autoplay = config.autoplay;
        var autoplay = _config$autoplay === undefined ? true : _config$autoplay;
        var _config$domWatcher = config.domWatcher;
        var domWatcher = _config$domWatcher === undefined ? DomWatcher() : _config$domWatcher;
        var _config$scriptLoader = config.scriptLoader;
        var scriptLoader = _config$scriptLoader === undefined ? ScriptLoader : _config$scriptLoader;
        var _config$mediatorHandler = config.mediatorHandler;
        var mediatorHandler = _config$mediatorHandler === undefined ? MediatorHandler : _config$mediatorHandler;

        var builder = MediatorsBuilder(domWatcher, scriptLoader, mediatorHandler, definitions);
        return autoplay ? builder.bootstrap() : builder;
    }

    return {
        setters: [function (_srcOrgCoreDisplayMediatorsBuilder) {
            MediatorsBuilder = _srcOrgCoreDisplayMediatorsBuilder["default"];
        }, function (_srcOrgCoreDisplayDomWatcher) {
            DomWatcher = _srcOrgCoreDisplayDomWatcher["default"];
        }, function (_srcOrgCoreNetScriptLoader) {
            ScriptLoader = _srcOrgCoreNetScriptLoader["default"];
        }, function (_srcOrgCoreDisplayMediatorHandler) {
            MediatorHandler = _srcOrgCoreDisplayMediatorHandler["default"];
        }],
        execute: function () {
            "use strict";

            ;
        }
    };
});
/**
 * Created by marco.gobbi on 21/01/2015.
 */
System.register("src/org/core/display/DomWatcher", ["src/org/core/events/Signal", "npm:ramda@0.13.0"], function (_export) {
    var Signal, R;

    _export("default", DomWatcher);

    function DomWatcher() {
        var onAdded = Signal();
        var onRemoved = Signal();

        var handleMutations = function handleMutations(mutations) {
            var response = R.reduce(function (result, mutation) {
                result.addedNodes = result.addedNodes.concat(Array.prototype.slice.call(mutation.addedNodes));
                result.removedNodes = result.removedNodes.concat(Array.prototype.slice.call(mutation.removedNodes));
                return result;
            }, { addedNodes: [], removedNodes: [] }, mutations);
            response.addedNodes.length && onAdded.emit(response.addedNodes);
            response.removedNodes.length && onRemoved.emit(response.removedNodes);
        };
        var observer = new MutationObserver(handleMutations);

        /* <h3>Configuration of the observer.</h3>
         <p>Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.</p>
         */
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

    return {
        setters: [function (_srcOrgCoreEventsSignal) {
            Signal = _srcOrgCoreEventsSignal["default"];
        }, function (_npmRamda0130) {
            R = _npmRamda0130["default"];
        }],
        execute: function () {
            "use strict";

            ;
        }
    };
});
System.register("src/org/core/net/ScriptLoader", ["npm:babel-runtime@5.2.17/core-js/promise"], function (_export) {
    var _Promise;

    function getPromise() {
        if (System["import"]) {
            return System["import"].bind(System);
        } else {
            return function (url) {
                return _Promise.resolve(System.get(url));
            };
        }
    }
    return {
        setters: [function (_npmBabelRuntime5217CoreJsPromise) {
            _Promise = _npmBabelRuntime5217CoreJsPromise["default"];
        }],
        execute: function () {
            "use strict";

            _export("default", {
                load: function load(id) {
                    return getPromise()(id).then(function (e) {
                        return e["default"];
                    })["catch"](console.log.bind(console));
                }
            });
        }
    };
});
System.register("src/org/core/robojs", ["src/org/core/net/ScriptLoader", "src/org/core/net/AMDScriptLoader", "src/org/core/events/EventMap", "src/org/core/events/EventDispatcher", "src/org/core/events/Signal", "src/org/core/display/DomWatcher", "src/org/core/display/Mediator", "src/org/core/display/MediatorsBuilder", "src/org/core/display/bootstrap", "src/org/core/display/MediatorHandler"], function (_export) {
    var ScriptLoader, AMDScriptLoader, EventMap, EventDispatcher, Signal, DomWatcher, Mediator, MediatorsBuilder, bootstrap, MediatorHandler, uid, flip, robojs;

    function nextUid() {
        "use strict";
        var index = uid.length;
        var digit = undefined;
        while (index) {
            index--;
            digit = uid[index].charCodeAt(0);
            if (digit == 57 /*'9'*/) {
                uid[index] = "A";
                return uid.join("");
            }
            if (digit == 90 /*'Z'*/) {
                uid[index] = "0";
            } else {
                uid[index] = String.fromCharCode(digit + 1);
                return uid.join("");
            }
        }
        uid.unshift("0");
        return uid.join("");
    }
    return {
        setters: [function (_srcOrgCoreNetScriptLoader) {
            ScriptLoader = _srcOrgCoreNetScriptLoader["default"];
        }, function (_srcOrgCoreNetAMDScriptLoader) {
            AMDScriptLoader = _srcOrgCoreNetAMDScriptLoader["default"];
        }, function (_srcOrgCoreEventsEventMap) {
            EventMap = _srcOrgCoreEventsEventMap["default"];
        }, function (_srcOrgCoreEventsEventDispatcher) {
            EventDispatcher = _srcOrgCoreEventsEventDispatcher["default"];
        }, function (_srcOrgCoreEventsSignal) {
            Signal = _srcOrgCoreEventsSignal["default"];
        }, function (_srcOrgCoreDisplayDomWatcher) {
            DomWatcher = _srcOrgCoreDisplayDomWatcher["default"];
        }, function (_srcOrgCoreDisplayMediator) {
            Mediator = _srcOrgCoreDisplayMediator["default"];
        }, function (_srcOrgCoreDisplayMediatorsBuilder) {
            MediatorsBuilder = _srcOrgCoreDisplayMediatorsBuilder["default"];
        }, function (_srcOrgCoreDisplayBootstrap) {
            bootstrap = _srcOrgCoreDisplayBootstrap["default"];
        }, function (_srcOrgCoreDisplayMediatorHandler) {
            MediatorHandler = _srcOrgCoreDisplayMediatorHandler["default"];
        }],
        execute: function () {
            "use strict";

            uid = ["0", "0", "0"];

            flip = function flip(f) {
                return function () {
                    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                    }

                    return f.apply(undefined, args.reverse());
                };
            };

            robojs = {
                MEDIATORS_CACHE: {},
                utils: {
                    uid: uid,
                    nextUid: nextUid,
                    flip: flip
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

            if (typeof define === "function" && define.amd) {
                // AMD. Register as an anonymous module.
                define("robojs", [], function () {
                    return robojs;
                });
            } else {
                // Browser globals
                window.robojs = robojs;
            }

            _export("default", robojs);
        }
    };
});
});
//# sourceMappingURL=robojs.es6.js.map