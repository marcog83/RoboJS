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

(['src/org/core/core'], function(System) {

System.register("npm:core-js@0.8.1/library/modules/$.fw", [], true, function(require, exports, module) {
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

System.register("npm:core-js@0.8.1/library/modules/$.uid", ["npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var sid = 0;
  function uid(key) {
    return 'Symbol(' + key + ')_' + (++sid + Math.random()).toString(36);
  }
  uid.safe = require("npm:core-js@0.8.1/library/modules/$").g.Symbol || uid;
  module.exports = uid;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.def", ["npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
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

System.register("npm:core-js@0.8.1/library/modules/$.invoke", [], true, function(require, exports, module) {
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

System.register("npm:core-js@0.8.1/library/modules/$.assert", ["npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$");
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

System.register("npm:core-js@0.8.1/library/modules/$.array-includes", ["npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$");
  module.exports = function(IS_INCLUDES) {
    return function(el) {
      var O = $.toObject(this),
          length = $.toLength(O.length),
          index = $.toIndex(arguments[1], length),
          value;
      if (IS_INCLUDES && el != el)
        while (length > index) {
          value = O[index++];
          if (value != value)
            return true;
        }
      else
        for (; length > index; index++)
          if (IS_INCLUDES || index in O) {
            if (O[index] === el)
              return IS_INCLUDES || index;
          }
      return !IS_INCLUDES && -1;
    };
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.replacer", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  module.exports = function(regExp, replace, isStatic) {
    var replacer = replace === Object(replace) ? function(part) {
      return replace[part];
    } : replace;
    return function(it) {
      return String(isStatic ? it : this).replace(regExp, replacer);
    };
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.keyof", ["npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$");
  module.exports = function(object, el) {
    var O = $.toObject(object),
        keys = $.getKeys(O),
        length = keys.length,
        index = 0,
        key;
    while (length > index)
      if (O[key = keys[index++]] === el)
        return key;
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.assign", ["npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$");
  module.exports = Object.assign || function(target, source) {
    var T = Object($.assertDefined(target)),
        l = arguments.length,
        i = 1;
    while (l > i) {
      var S = $.ES5Object(arguments[i++]),
          keys = $.getKeys(S),
          length = keys.length,
          j = 0,
          key;
      while (length > j)
        T[key = keys[j++]] = S[key];
    }
    return T;
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.object.is", ["npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.S, 'Object', {is: function(x, y) {
      return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.set-proto", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.ctx"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      assert = require("npm:core-js@0.8.1/library/modules/$.assert");
  module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function(buggy, set) {
    try {
      set = require("npm:core-js@0.8.1/library/modules/$.ctx")(Function.call, $.getDesc(Object.prototype, '__proto__').set, 2);
      set({}, []);
    } catch (e) {
      buggy = true;
    }
    return function(O, proto) {
      assert.obj(O);
      assert(proto === null || $.isObject(proto), proto, ": can't set as prototype!");
      if (buggy)
        O.__proto__ = proto;
      else
        set(O, proto);
      return O;
    };
  }() : undefined);
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.object.to-string", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      cof = require("npm:core-js@0.8.1/library/modules/$.cof"),
      tmp = {};
  tmp[require("npm:core-js@0.8.1/library/modules/$.wks")('toStringTag')] = 'z';
  if ($.FW && cof(tmp) != 'z')
    $.hide(Object.prototype, 'toString', function() {
      return '[object ' + cof.classof(this) + ']';
    });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.object.statics-accept-primitives", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      isObject = $.isObject,
      toObject = $.toObject;
  function wrapObjectMethod(METHOD, MODE) {
    var fn = ($.core.Object || {})[METHOD] || Object[METHOD],
        f = 0,
        o = {};
    o[METHOD] = MODE == 1 ? function(it) {
      return isObject(it) ? fn(it) : it;
    } : MODE == 2 ? function(it) {
      return isObject(it) ? fn(it) : true;
    } : MODE == 3 ? function(it) {
      return isObject(it) ? fn(it) : false;
    } : MODE == 4 ? function(it, key) {
      return fn(toObject(it), key);
    } : MODE == 5 ? function(it) {
      return fn(Object($.assertDefined(it)));
    } : function(it) {
      return fn(toObject(it));
    };
    try {
      fn('z');
    } catch (e) {
      f = 1;
    }
    $def($def.S + $def.F * f, 'Object', o);
  }
  wrapObjectMethod('freeze', 1);
  wrapObjectMethod('seal', 1);
  wrapObjectMethod('preventExtensions', 1);
  wrapObjectMethod('isFrozen', 2);
  wrapObjectMethod('isSealed', 2);
  wrapObjectMethod('isExtensible', 3);
  wrapObjectMethod('getOwnPropertyDescriptor', 4);
  wrapObjectMethod('getPrototypeOf', 5);
  wrapObjectMethod('keys');
  wrapObjectMethod('getOwnPropertyNames');
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.function.name", ["npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      NAME = 'name',
      setDesc = $.setDesc,
      FunctionProto = Function.prototype;
  NAME in FunctionProto || $.FW && $.DESC && setDesc(FunctionProto, NAME, {
    configurable: true,
    get: function() {
      var match = String(this).match(/^\s*function ([^ (]*)/),
          name = match ? match[1] : '';
      $.has(this, NAME) || setDesc(this, NAME, $.desc(5, name));
      return name;
    },
    set: function(value) {
      $.has(this, NAME) || setDesc(this, NAME, $.desc(0, value));
    }
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.number.constructor", ["npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      isObject = $.isObject,
      isFunction = $.isFunction,
      NUMBER = 'Number',
      Number = $.g[NUMBER],
      Base = Number,
      proto = Number.prototype;
  function toPrimitive(it) {
    var fn,
        val;
    if (isFunction(fn = it.valueOf) && !isObject(val = fn.call(it)))
      return val;
    if (isFunction(fn = it.toString) && !isObject(val = fn.call(it)))
      return val;
    throw TypeError("Can't convert object to number");
  }
  function toNumber(it) {
    if (isObject(it))
      it = toPrimitive(it);
    if (typeof it == 'string' && it.length > 2 && it.charCodeAt(0) == 48) {
      var binary = false;
      switch (it.charCodeAt(1)) {
        case 66:
        case 98:
          binary = true;
        case 79:
        case 111:
          return parseInt(it.slice(2), binary ? 2 : 8);
      }
    }
    return +it;
  }
  if ($.FW && !(Number('0o1') && Number('0b1'))) {
    Number = function Number(it) {
      return this instanceof Number ? new Base(toNumber(it)) : toNumber(it);
    };
    $.each.call($.DESC ? $.getNames(Base) : ('MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' + 'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' + 'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger').split(','), function(key) {
      if ($.has(Base, key) && !$.has(Number, key)) {
        $.setDesc(Number, key, $.getDesc(Base, key));
      }
    });
    Number.prototype = proto;
    proto.constructor = Number;
    $.hide($.g, NUMBER, Number);
  }
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.number.statics", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      abs = Math.abs,
      floor = Math.floor,
      MAX_SAFE_INTEGER = 0x1fffffffffffff;
  function isInteger(it) {
    return !$.isObject(it) && isFinite(it) && floor(it) === it;
  }
  $def($def.S, 'Number', {
    EPSILON: Math.pow(2, -52),
    isFinite: function(it) {
      return typeof it == 'number' && isFinite(it);
    },
    isInteger: isInteger,
    isNaN: function(number) {
      return number != number;
    },
    isSafeInteger: function(number) {
      return isInteger(number) && abs(number) <= MAX_SAFE_INTEGER;
    },
    MAX_SAFE_INTEGER: MAX_SAFE_INTEGER,
    MIN_SAFE_INTEGER: -MAX_SAFE_INTEGER,
    parseFloat: parseFloat,
    parseInt: parseInt
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.math", ["npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var Infinity = 1 / 0,
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      E = Math.E,
      pow = Math.pow,
      abs = Math.abs,
      exp = Math.exp,
      log = Math.log,
      sqrt = Math.sqrt,
      ceil = Math.ceil,
      floor = Math.floor,
      sign = Math.sign || function(x) {
        return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
      };
  function asinh(x) {
    return !isFinite(x = +x) || x == 0 ? x : x < 0 ? -asinh(-x) : log(x + sqrt(x * x + 1));
  }
  function expm1(x) {
    return (x = +x) == 0 ? x : x > -1e-6 && x < 1e-6 ? x + x * x / 2 : exp(x) - 1;
  }
  $def($def.S, 'Math', {
    acosh: function(x) {
      return (x = +x) < 1 ? NaN : isFinite(x) ? log(x / E + sqrt(x + 1) * sqrt(x - 1) / E) + 1 : x;
    },
    asinh: asinh,
    atanh: function(x) {
      return (x = +x) == 0 ? x : log((1 + x) / (1 - x)) / 2;
    },
    cbrt: function(x) {
      return sign(x = +x) * pow(abs(x), 1 / 3);
    },
    clz32: function(x) {
      return (x >>>= 0) ? 32 - x.toString(2).length : 32;
    },
    cosh: function(x) {
      return (exp(x = +x) + exp(-x)) / 2;
    },
    expm1: expm1,
    fround: function(x) {
      return new Float32Array([x])[0];
    },
    hypot: function(value1, value2) {
      var sum = 0,
          len1 = arguments.length,
          len2 = len1,
          args = Array(len1),
          larg = -Infinity,
          arg;
      while (len1--) {
        arg = args[len1] = +arguments[len1];
        if (arg == Infinity || arg == -Infinity)
          return Infinity;
        if (arg > larg)
          larg = arg;
      }
      larg = arg || 1;
      while (len2--)
        sum += pow(args[len2] / larg, 2);
      return larg * sqrt(sum);
    },
    imul: function(x, y) {
      var UInt16 = 0xffff,
          xn = +x,
          yn = +y,
          xl = UInt16 & xn,
          yl = UInt16 & yn;
      return 0 | xl * yl + ((UInt16 & xn >>> 16) * yl + xl * (UInt16 & yn >>> 16) << 16 >>> 0);
    },
    log1p: function(x) {
      return (x = +x) > -1e-8 && x < 1e-8 ? x - x * x / 2 : log(1 + x);
    },
    log10: function(x) {
      return log(x) / Math.LN10;
    },
    log2: function(x) {
      return log(x) / Math.LN2;
    },
    sign: sign,
    sinh: function(x) {
      return abs(x = +x) < 1 ? (expm1(x) - expm1(-x)) / 2 : (exp(x - 1) - exp(-x - 1)) * (E / 2);
    },
    tanh: function(x) {
      var a = expm1(x = +x),
          b = expm1(-x);
      return a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (exp(x) + exp(-x));
    },
    trunc: function(it) {
      return (it > 0 ? floor : ceil)(it);
    }
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.string.from-code-point", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      toIndex = require("npm:core-js@0.8.1/library/modules/$").toIndex,
      fromCharCode = String.fromCharCode;
  $def($def.S, 'String', {fromCodePoint: function(x) {
      var res = [],
          len = arguments.length,
          i = 0,
          code;
      while (len > i) {
        code = +arguments[i++];
        if (toIndex(code, 0x10ffff) !== code)
          throw RangeError(code + ' is not a valid code point');
        res.push(code < 0x10000 ? fromCharCode(code) : fromCharCode(((code -= 0x10000) >> 10) + 0xd800, code % 0x400 + 0xdc00));
      }
      return res.join('');
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.string.raw", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.S, 'String', {raw: function(callSite) {
      var raw = $.toObject(callSite.raw),
          len = $.toLength(raw.length),
          sln = arguments.length,
          res = [],
          i = 0;
      while (len > i) {
        res.push(String(raw[i++]));
        if (i < sln)
          res.push(String(arguments[i]));
      }
      return res.join('');
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.string-at", ["npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$");
  module.exports = function(TO_STRING) {
    return function(pos) {
      var s = String($.assertDefined(this)),
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

System.register("npm:core-js@0.8.1/library/modules/$.iter", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.ctx", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      ctx = require("npm:core-js@0.8.1/library/modules/$.ctx"),
      cof = require("npm:core-js@0.8.1/library/modules/$.cof"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      assertObject = require("npm:core-js@0.8.1/library/modules/$.assert").obj,
      SYMBOL_ITERATOR = require("npm:core-js@0.8.1/library/modules/$.wks")('iterator'),
      FF_ITERATOR = '@@iterator',
      Iterators = {},
      IteratorPrototype = {};
  var BUGGY = 'keys' in [] && !('next' in [].keys());
  setIterator(IteratorPrototype, $.that);
  function setIterator(O, value) {
    $.hide(O, SYMBOL_ITERATOR, value);
    if (FF_ITERATOR in [])
      $.hide(O, FF_ITERATOR, value);
  }
  function defineIterator(Constructor, NAME, value, DEFAULT) {
    var proto = Constructor.prototype,
        iter = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT] || value;
    if ($.FW)
      setIterator(proto, iter);
    if (iter !== value) {
      var iterProto = $.getProto(iter.call(new Constructor));
      cof.set(iterProto, NAME + ' Iterator', true);
      if ($.FW)
        $.has(proto, FF_ITERATOR) && setIterator(iterProto, $.that);
    }
    Iterators[NAME] = iter;
    Iterators[NAME + ' Iterator'] = $.that;
    return iter;
  }
  function getIterator(it) {
    var Symbol = $.g.Symbol,
        ext = it[Symbol && Symbol.iterator || FF_ITERATOR],
        getIter = ext || it[SYMBOL_ITERATOR] || Iterators[cof.classof(it)];
    return assertObject(getIter.call(it));
  }
  function closeIterator(iterator) {
    var ret = iterator['return'];
    if (ret !== undefined)
      assertObject(ret.call(iterator));
  }
  function stepCall(iterator, fn, value, entries) {
    try {
      return entries ? fn(assertObject(value)[0], value[1]) : fn(value);
    } catch (e) {
      closeIterator(iterator);
      throw e;
    }
  }
  var DANGER_CLOSING = true;
  !function() {
    try {
      var iter = [1].keys();
      iter['return'] = function() {
        DANGER_CLOSING = false;
      };
      Array.from(iter, function() {
        throw 2;
      });
    } catch (e) {}
  }();
  var $iter = module.exports = {
    BUGGY: BUGGY,
    DANGER_CLOSING: DANGER_CLOSING,
    fail: function(exec) {
      var fail = true;
      try {
        var arr = [[{}, 1]],
            iter = arr[SYMBOL_ITERATOR](),
            next = iter.next;
        iter.next = function() {
          fail = false;
          return next.call(this);
        };
        arr[SYMBOL_ITERATOR] = function() {
          return iter;
        };
        exec(arr);
      } catch (e) {}
      return fail;
    },
    Iterators: Iterators,
    prototype: IteratorPrototype,
    step: function(done, value) {
      return {
        value: value,
        done: !!done
      };
    },
    stepCall: stepCall,
    close: closeIterator,
    is: function(it) {
      var O = Object(it),
          Symbol = $.g.Symbol,
          SYM = Symbol && Symbol.iterator || FF_ITERATOR;
      return SYM in O || SYMBOL_ITERATOR in O || $.has(Iterators, cof.classof(O));
    },
    get: getIterator,
    set: setIterator,
    create: function(Constructor, NAME, next, proto) {
      Constructor.prototype = $.create(proto || $iter.prototype, {next: $.desc(1, next)});
      cof.set(Constructor, NAME + ' Iterator');
    },
    define: defineIterator,
    std: function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE) {
      function createIter(kind) {
        return function() {
          return new Constructor(this, kind);
        };
      }
      $iter.create(Constructor, NAME, next);
      var entries = createIter('key+value'),
          values = createIter('value'),
          proto = Base.prototype,
          methods,
          key;
      if (DEFAULT == 'value')
        values = defineIterator(Base, NAME, values, 'values');
      else
        entries = defineIterator(Base, NAME, entries, 'entries');
      if (DEFAULT) {
        methods = {
          entries: entries,
          keys: IS_SET ? values : createIter('key'),
          values: values
        };
        $def($def.P + $def.F * BUGGY, NAME, methods);
        if (FORCE)
          for (key in methods) {
            if (!(key in proto))
              $.hide(proto, key, methods[key]);
          }
      }
    },
    forOf: function(iterable, entries, fn, that) {
      var iterator = getIterator(iterable),
          f = ctx(fn, that, entries ? 2 : 1),
          step;
      while (!(step = iterator.next()).done) {
        if (stepCall(iterator, f, step.value, entries) === false) {
          return closeIterator(iterator);
        }
      }
    }
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.string.code-point-at", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.string-at"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.P, 'String', {codePointAt: require("npm:core-js@0.8.1/library/modules/$.string-at")(false)});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.string.ends-with", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      cof = require("npm:core-js@0.8.1/library/modules/$.cof"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      toLength = $.toLength;
  $def($def.P, 'String', {endsWith: function(searchString) {
      if (cof(searchString) == 'RegExp')
        throw TypeError();
      var that = String($.assertDefined(this)),
          endPosition = arguments[1],
          len = toLength(that.length),
          end = endPosition === undefined ? len : Math.min(toLength(endPosition), len);
      searchString += '';
      return that.slice(end - searchString.length, end) === searchString;
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.string.includes", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      cof = require("npm:core-js@0.8.1/library/modules/$.cof"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.P, 'String', {includes: function(searchString) {
      if (cof(searchString) == 'RegExp')
        throw TypeError();
      return !!~String($.assertDefined(this)).indexOf(searchString, arguments[1]);
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.string.repeat", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.P, 'String', {repeat: function(count) {
      var str = String($.assertDefined(this)),
          res = '',
          n = $.toInteger(count);
      if (n < 0 || n == Infinity)
        throw RangeError("Count can't be negative");
      for (; n > 0; (n >>>= 1) && (str += str))
        if (n & 1)
          res += str;
      return res;
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.string.starts-with", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      cof = require("npm:core-js@0.8.1/library/modules/$.cof"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.P, 'String', {startsWith: function(searchString) {
      if (cof(searchString) == 'RegExp')
        throw TypeError();
      var that = String($.assertDefined(this)),
          index = $.toLength(Math.min(arguments[1], that.length));
      searchString += '';
      return that.slice(index, index + searchString.length) === searchString;
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.array.from", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.ctx", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.iter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      ctx = require("npm:core-js@0.8.1/library/modules/$.ctx"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
      stepCall = $iter.stepCall;
  $def($def.S + $def.F * $iter.DANGER_CLOSING, 'Array', {from: function(arrayLike) {
      var O = Object($.assertDefined(arrayLike)),
          mapfn = arguments[1],
          mapping = mapfn !== undefined,
          f = mapping ? ctx(mapfn, arguments[2], 2) : undefined,
          index = 0,
          length,
          result,
          step,
          iterator;
      if ($iter.is(O)) {
        iterator = $iter.get(O);
        result = new (typeof this == 'function' ? this : Array);
        for (; !(step = iterator.next()).done; index++) {
          result[index] = mapping ? stepCall(iterator, f, [step.value, index], true) : step.value;
        }
      } else {
        result = new (typeof this == 'function' ? this : Array)(length = $.toLength(O.length));
        for (; length > index; index++) {
          result[index] = mapping ? f(O[index], index) : O[index];
        }
      }
      result.length = index;
      return result;
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.array.of", ["npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.S, 'Array', {of: function() {
      var index = 0,
          length = arguments.length,
          result = new (typeof this == 'function' ? this : Array)(length);
      while (length > index)
        result[index] = arguments[index++];
      result.length = length;
      return result;
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.unscope", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      UNSCOPABLES = require("npm:core-js@0.8.1/library/modules/$.wks")('unscopables');
  if ($.FW && !(UNSCOPABLES in []))
    $.hide(Array.prototype, UNSCOPABLES, {});
  module.exports = function(key) {
    if ($.FW)
      [][UNSCOPABLES][key] = true;
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.species", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$");
  module.exports = function(C) {
    if ($.DESC && $.FW)
      $.setDesc(C, require("npm:core-js@0.8.1/library/modules/$.wks")('species'), {
        configurable: true,
        get: $.that
      });
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.array.copy-within", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.unscope"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      toIndex = $.toIndex;
  $def($def.P, 'Array', {copyWithin: function(target, start) {
      var O = Object($.assertDefined(this)),
          len = $.toLength(O.length),
          to = toIndex(target, len),
          from = toIndex(start, len),
          end = arguments[2],
          fin = end === undefined ? len : toIndex(end, len),
          count = Math.min(fin - from, len - to),
          inc = 1;
      if (from < to && to < from + count) {
        inc = -1;
        from = from + count - 1;
        to = to + count - 1;
      }
      while (count-- > 0) {
        if (from in O)
          O[to] = O[from];
        else
          delete O[to];
        to += inc;
        from += inc;
      }
      return O;
    }});
  require("npm:core-js@0.8.1/library/modules/$.unscope")('copyWithin');
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.array.fill", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.unscope"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      toIndex = $.toIndex;
  $def($def.P, 'Array', {fill: function(value) {
      var O = Object($.assertDefined(this)),
          length = $.toLength(O.length),
          index = toIndex(arguments[1], length),
          end = arguments[2],
          endPos = end === undefined ? length : toIndex(end, length);
      while (endPos > index)
        O[index++] = value;
      return O;
    }});
  require("npm:core-js@0.8.1/library/modules/$.unscope")('fill');
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.array.find", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.array-methods", "npm:core-js@0.8.1/library/modules/$.unscope"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.P, 'Array', {find: require("npm:core-js@0.8.1/library/modules/$.array-methods")(5)});
  require("npm:core-js@0.8.1/library/modules/$.unscope")('find');
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.array.find-index", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.array-methods", "npm:core-js@0.8.1/library/modules/$.unscope"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.P, 'Array', {findIndex: require("npm:core-js@0.8.1/library/modules/$.array-methods")(6)});
  require("npm:core-js@0.8.1/library/modules/$.unscope")('findIndex');
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.regexp", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.replacer", "npm:core-js@0.8.1/library/modules/$.species"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      cof = require("npm:core-js@0.8.1/library/modules/$.cof"),
      RegExp = $.g.RegExp,
      Base = RegExp,
      proto = RegExp.prototype;
  if ($.FW && $.DESC) {
    if (!function() {
      try {
        return RegExp(/a/g, 'i') == '/a/i';
      } catch (e) {}
    }()) {
      RegExp = function RegExp(pattern, flags) {
        return new Base(cof(pattern) == 'RegExp' && flags !== undefined ? pattern.source : pattern, flags);
      };
      $.each.call($.getNames(Base), function(key) {
        key in RegExp || $.setDesc(RegExp, key, {
          configurable: true,
          get: function() {
            return Base[key];
          },
          set: function(it) {
            Base[key] = it;
          }
        });
      });
      proto.constructor = RegExp;
      RegExp.prototype = proto;
      $.hide($.g, 'RegExp', RegExp);
    }
    if (/./g.flags != 'g')
      $.setDesc(proto, 'flags', {
        configurable: true,
        get: require("npm:core-js@0.8.1/library/modules/$.replacer")(/^.*\/(\w*)$/, '$1')
      });
  }
  require("npm:core-js@0.8.1/library/modules/$.species")(RegExp);
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

System.register("npm:core-js@0.8.1/library/modules/$.collection-strong", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.ctx", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.iter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      ctx = require("npm:core-js@0.8.1/library/modules/$.ctx"),
      safe = require("npm:core-js@0.8.1/library/modules/$.uid").safe,
      assert = require("npm:core-js@0.8.1/library/modules/$.assert"),
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
      has = $.has,
      set = $.set,
      isObject = $.isObject,
      hide = $.hide,
      step = $iter.step,
      isFrozen = Object.isFrozen || $.core.Object.isFrozen,
      ID = safe('id'),
      O1 = safe('O1'),
      LAST = safe('last'),
      FIRST = safe('first'),
      ITER = safe('iter'),
      SIZE = $.DESC ? safe('size') : 'size',
      id = 0;
  function fastKey(it, create) {
    if (!isObject(it))
      return (typeof it == 'string' ? 'S' : 'P') + it;
    if (isFrozen(it))
      return 'F';
    if (!has(it, ID)) {
      if (!create)
        return 'E';
      hide(it, ID, ++id);
    }
    return 'O' + it[ID];
  }
  function getEntry(that, key) {
    var index = fastKey(key),
        entry;
    if (index != 'F')
      return that[O1][index];
    for (entry = that[FIRST]; entry; entry = entry.n) {
      if (entry.k == key)
        return entry;
    }
  }
  module.exports = {
    getConstructor: function(NAME, IS_MAP, ADDER) {
      function C(iterable) {
        var that = assert.inst(this, C, NAME);
        set(that, O1, $.create(null));
        set(that, SIZE, 0);
        set(that, LAST, undefined);
        set(that, FIRST, undefined);
        if (iterable != undefined)
          $iter.forOf(iterable, IS_MAP, that[ADDER], that);
      }
      $.mix(C.prototype, {
        clear: function() {
          for (var that = this,
              data = that[O1],
              entry = that[FIRST]; entry; entry = entry.n) {
            entry.r = true;
            if (entry.p)
              entry.p = entry.p.n = undefined;
            delete data[entry.i];
          }
          that[FIRST] = that[LAST] = undefined;
          that[SIZE] = 0;
        },
        'delete': function(key) {
          var that = this,
              entry = getEntry(that, key);
          if (entry) {
            var next = entry.n,
                prev = entry.p;
            delete that[O1][entry.i];
            entry.r = true;
            if (prev)
              prev.n = next;
            if (next)
              next.p = prev;
            if (that[FIRST] == entry)
              that[FIRST] = next;
            if (that[LAST] == entry)
              that[LAST] = prev;
            that[SIZE]--;
          }
          return !!entry;
        },
        forEach: function(callbackfn) {
          var f = ctx(callbackfn, arguments[1], 3),
              entry;
          while (entry = entry ? entry.n : this[FIRST]) {
            f(entry.v, entry.k, this);
            while (entry && entry.r)
              entry = entry.p;
          }
        },
        has: function(key) {
          return !!getEntry(this, key);
        }
      });
      if ($.DESC)
        $.setDesc(C.prototype, 'size', {get: function() {
            return assert.def(this[SIZE]);
          }});
      return C;
    },
    def: function(that, key, value) {
      var entry = getEntry(that, key),
          prev,
          index;
      if (entry) {
        entry.v = value;
      } else {
        that[LAST] = entry = {
          i: index = fastKey(key, true),
          k: key,
          v: value,
          p: prev = that[LAST],
          n: undefined,
          r: false
        };
        if (!that[FIRST])
          that[FIRST] = entry;
        if (prev)
          prev.n = entry;
        that[SIZE]++;
        if (index != 'F')
          that[O1][index] = entry;
      }
      return that;
    },
    getEntry: getEntry,
    getIterConstructor: function() {
      return function(iterated, kind) {
        set(this, ITER, {
          o: iterated,
          k: kind
        });
      };
    },
    next: function() {
      var iter = this[ITER],
          kind = iter.k,
          entry = iter.l;
      while (entry && entry.r)
        entry = entry.p;
      if (!iter.o || !(iter.l = entry = entry ? entry.n : iter.o[FIRST])) {
        iter.o = undefined;
        return step(1);
      }
      if (kind == 'key')
        return step(0, entry.k);
      if (kind == 'value')
        return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.collection", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.iter", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.species"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
      assertInstance = require("npm:core-js@0.8.1/library/modules/$.assert").inst;
  module.exports = function(NAME, methods, common, IS_MAP, isWeak) {
    var Base = $.g[NAME],
        C = Base,
        ADDER = IS_MAP ? 'set' : 'add',
        proto = C && C.prototype,
        O = {};
    function fixMethod(KEY, CHAIN) {
      var method = proto[KEY];
      if ($.FW)
        proto[KEY] = function(a, b) {
          var result = method.call(this, a === 0 ? 0 : a, b);
          return CHAIN ? this : result;
        };
    }
    if (!$.isFunction(C) || !(isWeak || !$iter.BUGGY && proto.forEach && proto.entries)) {
      C = common.getConstructor(NAME, IS_MAP, ADDER);
      $.mix(C.prototype, methods);
    } else {
      var inst = new C,
          chain = inst[ADDER](isWeak ? {} : -0, 1),
          buggyZero;
      if ($iter.fail(function(iter) {
        new C(iter);
      }) || $iter.DANGER_CLOSING) {
        C = function(iterable) {
          assertInstance(this, C, NAME);
          var that = new Base;
          if (iterable != undefined)
            $iter.forOf(iterable, IS_MAP, that[ADDER], that);
          return that;
        };
        C.prototype = proto;
        if ($.FW)
          proto.constructor = C;
      }
      isWeak || inst.forEach(function(val, key) {
        buggyZero = 1 / key === -Infinity;
      });
      if (buggyZero) {
        fixMethod('delete');
        fixMethod('has');
        IS_MAP && fixMethod('get');
      }
      if (buggyZero || chain !== inst)
        fixMethod(ADDER, true);
    }
    require("npm:core-js@0.8.1/library/modules/$.cof").set(C, NAME);
    require("npm:core-js@0.8.1/library/modules/$.species")(C);
    O[NAME] = C;
    $def($def.G + $def.W + $def.F * (C != Base), O);
    if (!isWeak)
      $iter.std(C, NAME, common.getIterConstructor(), common.next, IS_MAP ? 'key+value' : 'value', !IS_MAP, true);
    return C;
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.set", ["npm:core-js@0.8.1/library/modules/$.collection-strong", "npm:core-js@0.8.1/library/modules/$.collection"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var strong = require("npm:core-js@0.8.1/library/modules/$.collection-strong");
  require("npm:core-js@0.8.1/library/modules/$.collection")('Set', {add: function(value) {
      return strong.def(this, value = value === 0 ? 0 : value, value);
    }}, strong);
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.collection-weak", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.iter", "npm:core-js@0.8.1/library/modules/$.array-methods"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      safe = require("npm:core-js@0.8.1/library/modules/$.uid").safe,
      assert = require("npm:core-js@0.8.1/library/modules/$.assert"),
      forOf = require("npm:core-js@0.8.1/library/modules/$.iter").forOf,
      has = $.has,
      isObject = $.isObject,
      hide = $.hide,
      isFrozen = Object.isFrozen || $.core.Object.isFrozen,
      id = 0,
      ID = safe('id'),
      WEAK = safe('weak'),
      LEAK = safe('leak'),
      method = require("npm:core-js@0.8.1/library/modules/$.array-methods"),
      find = method(5),
      findIndex = method(6);
  function findFrozen(store, key) {
    return find.call(store.array, function(it) {
      return it[0] === key;
    });
  }
  function leakStore(that) {
    return that[LEAK] || hide(that, LEAK, {
      array: [],
      get: function(key) {
        var entry = findFrozen(this, key);
        if (entry)
          return entry[1];
      },
      has: function(key) {
        return !!findFrozen(this, key);
      },
      set: function(key, value) {
        var entry = findFrozen(this, key);
        if (entry)
          entry[1] = value;
        else
          this.array.push([key, value]);
      },
      'delete': function(key) {
        var index = findIndex.call(this.array, function(it) {
          return it[0] === key;
        });
        if (~index)
          this.array.splice(index, 1);
        return !!~index;
      }
    })[LEAK];
  }
  module.exports = {
    getConstructor: function(NAME, IS_MAP, ADDER) {
      function C(iterable) {
        $.set(assert.inst(this, C, NAME), ID, id++);
        if (iterable != undefined)
          forOf(iterable, IS_MAP, this[ADDER], this);
      }
      $.mix(C.prototype, {
        'delete': function(key) {
          if (!isObject(key))
            return false;
          if (isFrozen(key))
            return leakStore(this)['delete'](key);
          return has(key, WEAK) && has(key[WEAK], this[ID]) && delete key[WEAK][this[ID]];
        },
        has: function(key) {
          if (!isObject(key))
            return false;
          if (isFrozen(key))
            return leakStore(this).has(key);
          return has(key, WEAK) && has(key[WEAK], this[ID]);
        }
      });
      return C;
    },
    def: function(that, key, value) {
      if (isFrozen(assert.obj(key))) {
        leakStore(that).set(key, value);
      } else {
        has(key, WEAK) || hide(key, WEAK, {});
        key[WEAK][that[ID]] = value;
      }
      return that;
    },
    leakStore: leakStore,
    WEAK: WEAK,
    ID: ID
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.weak-set", ["npm:core-js@0.8.1/library/modules/$.collection-weak", "npm:core-js@0.8.1/library/modules/$.collection"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var weak = require("npm:core-js@0.8.1/library/modules/$.collection-weak");
  require("npm:core-js@0.8.1/library/modules/$.collection")('WeakSet', {add: function(value) {
      return weak.def(this, value, true);
    }}, weak, false, true);
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.own-keys", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.assert"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      assertObject = require("npm:core-js@0.8.1/library/modules/$.assert").obj;
  module.exports = function(it) {
    assertObject(it);
    return $.getSymbols ? $.getNames(it).concat($.getSymbols(it)) : $.getNames(it);
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es7.array.includes", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.array-includes", "npm:core-js@0.8.1/library/modules/$.unscope"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.P, 'Array', {includes: require("npm:core-js@0.8.1/library/modules/$.array-includes")(true)});
  require("npm:core-js@0.8.1/library/modules/$.unscope")('includes');
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es7.string.at", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.string-at"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.P, 'String', {at: require("npm:core-js@0.8.1/library/modules/$.string-at")(true)});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es7.regexp.escape", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.replacer"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.S, 'RegExp', {escape: require("npm:core-js@0.8.1/library/modules/$.replacer")(/([\\\-[\]{}()*+?.,^$|])/g, '\\$1', true)});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es7.object.get-own-property-descriptors", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.own-keys"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      ownKeys = require("npm:core-js@0.8.1/library/modules/$.own-keys");
  $def($def.S, 'Object', {getOwnPropertyDescriptors: function(object) {
      var O = $.toObject(object),
          result = {};
      $.each.call(ownKeys(O), function(key) {
        $.setDesc(result, key, $.desc(0, $.getDesc(O, key)));
      });
      return result;
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es7.object.to-array", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def");
  function createObjectToArray(isEntries) {
    return function(object) {
      var O = $.toObject(object),
          keys = $.getKeys(object),
          length = keys.length,
          i = 0,
          result = Array(length),
          key;
      if (isEntries)
        while (length > i)
          result[i] = [key = keys[i++], O[key]];
      else
        while (length > i)
          result[i] = O[keys[i++]];
      return result;
    };
  }
  $def($def.S, 'Object', {
    values: createObjectToArray(false),
    entries: createObjectToArray(true)
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/js.array.statics", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.ctx"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      core = $.core,
      statics = {};
  function setStatics(keys, length) {
    $.each.call(keys.split(','), function(key) {
      if (length == undefined && key in core.Array)
        statics[key] = core.Array[key];
      else if (key in [])
        statics[key] = require("npm:core-js@0.8.1/library/modules/$.ctx")(Function.call, [][key], length);
    });
  }
  setStatics('pop,reverse,shift,keys,values,entries', 1);
  setStatics('indexOf,every,some,forEach,map,filter,find,findIndex,includes', 3);
  setStatics('join,slice,concat,push,splice,unshift,sort,lastIndexOf,' + 'reduce,reduceRight,copyWithin,fill,turn');
  $def($def.S, 'Array', statics);
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.partial", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.invoke", "npm:core-js@0.8.1/library/modules/$.assert"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      invoke = require("npm:core-js@0.8.1/library/modules/$.invoke"),
      assertFunction = require("npm:core-js@0.8.1/library/modules/$.assert").fn;
  module.exports = function() {
    var fn = assertFunction(this),
        length = arguments.length,
        pargs = Array(length),
        i = 0,
        _ = $.path._,
        holder = false;
    while (length > i)
      if ((pargs[i] = arguments[i++]) === _)
        holder = true;
    return function() {
      var that = this,
          _length = arguments.length,
          j = 0,
          k = 0,
          args;
      if (!holder && !_length)
        return invoke(fn, pargs, that);
      args = pargs.slice();
      if (holder)
        for (; length > j; j++)
          if (args[j] === _)
            args[j] = arguments[k++];
      while (_length > k)
        args.push(arguments[k++]);
      return invoke(fn, args, that);
    };
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/web.immediate", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.task"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      $task = require("npm:core-js@0.8.1/library/modules/$.task");
  $def($def.G + $def.B, {
    setImmediate: $task.set,
    clearImmediate: $task.clear
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/web.dom.iterable", ["npm:core-js@0.8.1/library/modules/es6.array.iterator", "npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.iter", "npm:core-js@0.8.1/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  require("npm:core-js@0.8.1/library/modules/es6.array.iterator");
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      Iterators = require("npm:core-js@0.8.1/library/modules/$.iter").Iterators,
      ITERATOR = require("npm:core-js@0.8.1/library/modules/$.wks")('iterator'),
      NodeList = $.g.NodeList;
  if ($.FW && NodeList && !(ITERATOR in NodeList.prototype)) {
    $.hide(NodeList.prototype, ITERATOR, Iterators.Array);
  }
  Iterators.NodeList = Iterators.Array;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.dict", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.ctx", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.assign", "npm:core-js@0.8.1/library/modules/$.keyof", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.iter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      ctx = require("npm:core-js@0.8.1/library/modules/$.ctx"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      assign = require("npm:core-js@0.8.1/library/modules/$.assign"),
      keyOf = require("npm:core-js@0.8.1/library/modules/$.keyof"),
      ITER = require("npm:core-js@0.8.1/library/modules/$.uid").safe('iter'),
      assert = require("npm:core-js@0.8.1/library/modules/$.assert"),
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
      step = $iter.step,
      getKeys = $.getKeys,
      toObject = $.toObject,
      has = $.has;
  function Dict(iterable) {
    var dict = $.create(null);
    if (iterable != undefined) {
      if ($iter.is(iterable)) {
        $iter.forOf(iterable, true, function(key, value) {
          dict[key] = value;
        });
      } else
        assign(dict, iterable);
    }
    return dict;
  }
  Dict.prototype = null;
  function DictIterator(iterated, kind) {
    $.set(this, ITER, {
      o: toObject(iterated),
      a: getKeys(iterated),
      i: 0,
      k: kind
    });
  }
  $iter.create(DictIterator, 'Dict', function() {
    var iter = this[ITER],
        O = iter.o,
        keys = iter.a,
        kind = iter.k,
        key;
    do {
      if (iter.i >= keys.length) {
        iter.o = undefined;
        return step(1);
      }
    } while (!has(O, key = keys[iter.i++]));
    if (kind == 'key')
      return step(0, key);
    if (kind == 'value')
      return step(0, O[key]);
    return step(0, [key, O[key]]);
  });
  function createDictIter(kind) {
    return function(it) {
      return new DictIterator(it, kind);
    };
  }
  function generic(A, B) {
    return typeof A == 'function' ? A : B;
  }
  function createDictMethod(TYPE) {
    var IS_MAP = TYPE == 1,
        IS_EVERY = TYPE == 4;
    return function(object, callbackfn, that) {
      var f = ctx(callbackfn, that, 3),
          O = toObject(object),
          result = IS_MAP || TYPE == 7 || TYPE == 2 ? new (generic(this, Dict)) : undefined,
          key,
          val,
          res;
      for (key in O)
        if (has(O, key)) {
          val = O[key];
          res = f(val, key, object);
          if (TYPE) {
            if (IS_MAP)
              result[key] = res;
            else if (res)
              switch (TYPE) {
                case 2:
                  result[key] = val;
                  break;
                case 3:
                  return true;
                case 5:
                  return val;
                case 6:
                  return key;
                case 7:
                  result[res[0]] = res[1];
              }
            else if (IS_EVERY)
              return false;
          }
        }
      return TYPE == 3 || IS_EVERY ? IS_EVERY : result;
    };
  }
  function createDictReduce(IS_TURN) {
    return function(object, mapfn, init) {
      assert.fn(mapfn);
      var O = toObject(object),
          keys = getKeys(O),
          length = keys.length,
          i = 0,
          memo,
          key,
          result;
      if (IS_TURN) {
        memo = init == undefined ? new (generic(this, Dict)) : Object(init);
      } else if (arguments.length < 3) {
        assert(length, 'Reduce of empty object with no initial value');
        memo = O[keys[i++]];
      } else
        memo = Object(init);
      while (length > i)
        if (has(O, key = keys[i++])) {
          result = mapfn(memo, O[key], key, object);
          if (IS_TURN) {
            if (result === false)
              break;
          } else
            memo = result;
        }
      return memo;
    };
  }
  var findKey = createDictMethod(6);
  $def($def.G + $def.F, {Dict: $.mix(Dict, {
      keys: createDictIter('key'),
      values: createDictIter('value'),
      entries: createDictIter('key+value'),
      forEach: createDictMethod(0),
      map: createDictMethod(1),
      filter: createDictMethod(2),
      some: createDictMethod(3),
      every: createDictMethod(4),
      find: createDictMethod(5),
      findKey: findKey,
      mapPairs: createDictMethod(7),
      reduce: createDictReduce(false),
      turn: createDictReduce(true),
      keyOf: keyOf,
      includes: function(object, el) {
        return (el == el ? keyOf(object, el) : findKey(object, function(it) {
          return it != it;
        })) !== undefined;
      },
      has: has,
      get: function(object, key) {
        if (has(object, key))
          return object[key];
      },
      set: $.def,
      isDict: function(it) {
        return $.isObject(it) && $.getProto(it) === Dict.prototype;
      }
    })});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.iter-helpers", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.iter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var core = require("npm:core-js@0.8.1/library/modules/$").core,
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter");
  core.isIterable = $iter.is;
  core.getIterator = $iter.get;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.$for", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.ctx", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.iter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      ctx = require("npm:core-js@0.8.1/library/modules/$.ctx"),
      safe = require("npm:core-js@0.8.1/library/modules/$.uid").safe,
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
      ENTRIES = safe('entries'),
      FN = safe('fn'),
      ITER = safe('iter'),
      forOf = $iter.forOf,
      stepCall = $iter.stepCall,
      getIterator = $iter.get,
      setIterator = $iter.set,
      createIterator = $iter.create;
  function $for(iterable, entries) {
    if (!(this instanceof $for))
      return new $for(iterable, entries);
    this[ITER] = getIterator(iterable);
    this[ENTRIES] = !!entries;
  }
  createIterator($for, 'Wrapper', function() {
    return this[ITER].next();
  });
  var $forProto = $for.prototype;
  setIterator($forProto, function() {
    return this[ITER];
  });
  function createChainIterator(next) {
    function Iterator(iter, fn, that) {
      this[ITER] = getIterator(iter);
      this[ENTRIES] = iter[ENTRIES];
      this[FN] = ctx(fn, that, iter[ENTRIES] ? 2 : 1);
    }
    createIterator(Iterator, 'Chain', next, $forProto);
    setIterator(Iterator.prototype, $.that);
    return Iterator;
  }
  var MapIter = createChainIterator(function() {
    var step = this[ITER].next();
    return step.done ? step : $iter.step(0, stepCall(this[ITER], this[FN], step.value, this[ENTRIES]));
  });
  var FilterIter = createChainIterator(function() {
    for (; ; ) {
      var step = this[ITER].next();
      if (step.done || stepCall(this[ITER], this[FN], step.value, this[ENTRIES]))
        return step;
    }
  });
  $.mix($forProto, {
    of: function(fn, that) {
      forOf(this, this[ENTRIES], fn, that);
    },
    array: function(fn, that) {
      var result = [];
      forOf(fn != undefined ? this.map(fn, that) : this, false, result.push, result);
      return result;
    },
    filter: function(fn, that) {
      return new FilterIter(this, fn, that);
    },
    map: function(fn, that) {
      return new MapIter(this, fn, that);
    }
  });
  $for.isIterable = $iter.is;
  $for.getIterator = getIterator;
  $def($def.G + $def.F, {$for: $for});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.delay", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.partial"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      partial = require("npm:core-js@0.8.1/library/modules/$.partial");
  $def($def.G + $def.F, {delay: function(time) {
      return new ($.core.Promise || $.g.Promise)(function(resolve) {
        setTimeout(partial.call(resolve, true), time);
      });
    }});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.binding", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.ctx", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.invoke", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.partial"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      ctx = require("npm:core-js@0.8.1/library/modules/$.ctx"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      invoke = require("npm:core-js@0.8.1/library/modules/$.invoke"),
      hide = $.hide,
      assertFunction = require("npm:core-js@0.8.1/library/modules/$.assert").fn,
      _ = $.DESC ? require("npm:core-js@0.8.1/library/modules/$.uid")('tie') : 'toLocaleString',
      toLocaleString = {}.toLocaleString;
  $.core._ = $.path._ = $.path._ || {};
  $def($def.P + $def.F, 'Function', {
    part: require("npm:core-js@0.8.1/library/modules/$.partial"),
    only: function(numberArguments, that) {
      var fn = assertFunction(this),
          n = $.toLength(numberArguments),
          isThat = arguments.length > 1;
      return function() {
        var length = Math.min(n, arguments.length),
            args = Array(length),
            i = 0;
        while (length > i)
          args[i] = arguments[i++];
        return invoke(fn, args, isThat ? that : this);
      };
    }
  });
  function tie(key) {
    var that = this,
        bound = {};
    return hide(that, _, function(key) {
      if (key === undefined || !(key in that))
        return toLocaleString.call(that);
      return $.has(bound, key) ? bound[key] : bound[key] = ctx(that[key], that, -1);
    })[_](key);
  }
  hide($.path._, 'toString', function() {
    return _;
  });
  hide(Object.prototype, _, tie);
  $.DESC || hide(Array.prototype, _, tie);
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.object", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.own-keys", "npm:core-js@0.8.1/library/modules/$.cof"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      ownKeys = require("npm:core-js@0.8.1/library/modules/$.own-keys");
  function define(target, mixin) {
    var keys = ownKeys($.toObject(mixin)),
        length = keys.length,
        i = 0,
        key;
    while (length > i)
      $.setDesc(target, key = keys[i++], $.getDesc(mixin, key));
    return target;
  }
  $def($def.S + $def.F, 'Object', {
    isObject: $.isObject,
    classof: require("npm:core-js@0.8.1/library/modules/$.cof").classof,
    define: define,
    make: function(proto, mixin) {
      return define($.create(proto), mixin);
    }
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.array.turn", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.unscope"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      assertFunction = require("npm:core-js@0.8.1/library/modules/$.assert").fn;
  $def($def.P + $def.F, 'Array', {turn: function(fn, target) {
      assertFunction(fn);
      var memo = target == undefined ? [] : Object(target),
          O = $.ES5Object(this),
          length = $.toLength(O.length),
          index = 0;
      while (length > index)
        if (fn(memo, O[index], index++, this) === false)
          break;
      return memo;
    }});
  require("npm:core-js@0.8.1/library/modules/$.unscope")('turn');
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.number.iterator", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.iter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      ITER = require("npm:core-js@0.8.1/library/modules/$.uid").safe('iter'),
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
      step = $iter.step,
      NUMBER = 'Number';
  function NumberIterator(iterated) {
    $.set(this, ITER, {
      l: $.toLength(iterated),
      i: 0
    });
  }
  $iter.create(NumberIterator, NUMBER, function() {
    var iter = this[ITER],
        i = iter.i++;
    return i < iter.l ? step(0, i) : step(1);
  });
  $iter.define(Number, NUMBER, function() {
    return new NumberIterator(this);
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.number.math", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.invoke"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      invoke = require("npm:core-js@0.8.1/library/modules/$.invoke"),
      methods = {};
  methods.random = function(lim) {
    var a = +this,
        b = lim == undefined ? 0 : +lim,
        m = Math.min(a, b);
    return Math.random() * (Math.max(a, b) - m) + m;
  };
  if ($.FW)
    $.each.call(('round,floor,ceil,abs,sin,asin,cos,acos,tan,atan,exp,sqrt,max,min,pow,atan2,' + 'acosh,asinh,atanh,cbrt,clz32,cosh,expm1,hypot,imul,log1p,log10,log2,sign,sinh,tanh,trunc').split(','), function(key) {
      var fn = Math[key];
      if (fn)
        methods[key] = function() {
          var args = [+this],
              i = 0;
          while (arguments.length > i)
            args.push(arguments[i++]);
          return invoke(fn, args);
        };
    });
  $def($def.P + $def.F, 'Number', methods);
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.string.escape-html", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.replacer"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      replacer = require("npm:core-js@0.8.1/library/modules/$.replacer");
  var escapeHTMLDict = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  },
      unescapeHTMLDict = {},
      key;
  for (key in escapeHTMLDict)
    unescapeHTMLDict[escapeHTMLDict[key]] = key;
  $def($def.P + $def.F, 'String', {
    escapeHTML: replacer(/[&<>"']/g, escapeHTMLDict),
    unescapeHTML: replacer(/&(?:amp|lt|gt|quot|apos);/g, unescapeHTMLDict)
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.date", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      core = $.core,
      formatRegExp = /\b\w\w?\b/g,
      flexioRegExp = /:(.*)\|(.*)$/,
      locales = {},
      current = 'en',
      SECONDS = 'Seconds',
      MINUTES = 'Minutes',
      HOURS = 'Hours',
      DATE = 'Date',
      MONTH = 'Month',
      YEAR = 'FullYear';
  function lz(num) {
    return num > 9 ? num : '0' + num;
  }
  function createFormat(prefix) {
    return function(template, locale) {
      var that = this,
          dict = locales[$.has(locales, locale) ? locale : current];
      function get(unit) {
        return that[prefix + unit]();
      }
      return String(template).replace(formatRegExp, function(part) {
        switch (part) {
          case 's':
            return get(SECONDS);
          case 'ss':
            return lz(get(SECONDS));
          case 'm':
            return get(MINUTES);
          case 'mm':
            return lz(get(MINUTES));
          case 'h':
            return get(HOURS);
          case 'hh':
            return lz(get(HOURS));
          case 'D':
            return get(DATE);
          case 'DD':
            return lz(get(DATE));
          case 'W':
            return dict[0][get('Day')];
          case 'N':
            return get(MONTH) + 1;
          case 'NN':
            return lz(get(MONTH) + 1);
          case 'M':
            return dict[2][get(MONTH)];
          case 'MM':
            return dict[1][get(MONTH)];
          case 'Y':
            return get(YEAR);
          case 'YY':
            return lz(get(YEAR) % 100);
        }
        return part;
      });
    };
  }
  function addLocale(lang, locale) {
    function split(index) {
      var result = [];
      $.each.call(locale.months.split(','), function(it) {
        result.push(it.replace(flexioRegExp, '$' + index));
      });
      return result;
    }
    locales[lang] = [locale.weekdays.split(','), split(1), split(2)];
    return core;
  }
  $def($def.P + $def.F, DATE, {
    format: createFormat('get'),
    formatUTC: createFormat('getUTC')
  });
  addLocale(current, {
    weekdays: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    months: 'January,February,March,April,May,June,July,August,September,October,November,December'
  });
  addLocale('ru', {
    weekdays: 'Воскресенье,Понедельник,Вторник,Среда,Четверг,Пятница,Суббота',
    months: 'Январ:я|ь,Феврал:я|ь,Март:а|,Апрел:я|ь,Ма:я|й,Июн:я|ь,' + 'Июл:я|ь,Август:а|,Сентябр:я|ь,Октябр:я|ь,Ноябр:я|ь,Декабр:я|ь'
  });
  core.locale = function(locale) {
    return $.has(locales, locale) ? current = locale : current;
  };
  core.addLocale = addLocale;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.global", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.G + $def.F, {global: require("npm:core-js@0.8.1/library/modules/$").g});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/core.log", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.assign"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      log = {},
      enabled = true;
  $.each.call(('assert,clear,count,debug,dir,dirxml,error,exception,' + 'group,groupCollapsed,groupEnd,info,isIndependentlyComposed,log,' + 'markTimeline,profile,profileEnd,table,time,timeEnd,timeline,' + 'timelineEnd,timeStamp,trace,warn').split(','), function(key) {
    log[key] = function() {
      if (enabled && $.g.console && $.isFunction(console[key])) {
        return Function.apply.call(console[key], console, arguments);
      }
    };
  });
  $def($def.G + $def.F, {log: require("npm:core-js@0.8.1/library/modules/$.assign")(log.log, log, {
      enable: function() {
        enabled = true;
      },
      disable: function() {
        enabled = false;
      }
    })});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$", ["npm:core-js@0.8.1/library/modules/$.fw"], true, function(require, exports, module) {
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
  var $ = module.exports = require("npm:core-js@0.8.1/library/modules/$.fw")({
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

System.register("npm:core-js@0.8.1/library/modules/$.wks", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.uid"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var global = require("npm:core-js@0.8.1/library/modules/$").g,
      store = {};
  module.exports = function(name) {
    return store[name] || (store[name] = global.Symbol && global.Symbol[name] || require("npm:core-js@0.8.1/library/modules/$.uid").safe('Symbol.' + name));
  };
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.ctx", ["npm:core-js@0.8.1/library/modules/$.assert"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var assertFunction = require("npm:core-js@0.8.1/library/modules/$.assert").fn;
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

System.register("npm:core-js@0.8.1/library/modules/es6.symbol", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.keyof", "npm:core-js@0.8.1/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      setTag = require("npm:core-js@0.8.1/library/modules/$.cof").set,
      uid = require("npm:core-js@0.8.1/library/modules/$.uid"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      keyOf = require("npm:core-js@0.8.1/library/modules/$.keyof"),
      has = $.has,
      hide = $.hide,
      getNames = $.getNames,
      toObject = $.toObject,
      Symbol = $.g.Symbol,
      Base = Symbol,
      setter = false,
      TAG = uid.safe('tag'),
      SymbolRegistry = {},
      AllSymbols = {};
  function wrap(tag) {
    var sym = AllSymbols[tag] = $.set($.create(Symbol.prototype), TAG, tag);
    $.DESC && setter && $.setDesc(Object.prototype, tag, {
      configurable: true,
      set: function(value) {
        hide(this, tag, value);
      }
    });
    return sym;
  }
  if (!$.isFunction(Symbol)) {
    Symbol = function(description) {
      if (this instanceof Symbol)
        throw TypeError('Symbol is not a constructor');
      return wrap(uid(description));
    };
    hide(Symbol.prototype, 'toString', function() {
      return this[TAG];
    });
  }
  $def($def.G + $def.W, {Symbol: Symbol});
  var symbolStatics = {
    'for': function(key) {
      return has(SymbolRegistry, key += '') ? SymbolRegistry[key] : SymbolRegistry[key] = Symbol(key);
    },
    keyFor: function(key) {
      return keyOf(SymbolRegistry, key);
    },
    pure: uid.safe,
    set: $.set,
    useSetter: function() {
      setter = true;
    },
    useSimple: function() {
      setter = false;
    }
  };
  $.each.call(('hasInstance,isConcatSpreadable,iterator,match,replace,search,' + 'species,split,toPrimitive,toStringTag,unscopables').split(','), function(it) {
    var sym = require("npm:core-js@0.8.1/library/modules/$.wks")(it);
    symbolStatics[it] = Symbol === Base ? sym : wrap(sym);
  });
  setter = true;
  $def($def.S, 'Symbol', symbolStatics);
  $def($def.S + $def.F * (Symbol != Base), 'Object', {
    getOwnPropertyNames: function(it) {
      var names = getNames(toObject(it)),
          result = [],
          key,
          i = 0;
      while (names.length > i)
        has(AllSymbols, key = names[i++]) || result.push(key);
      return result;
    },
    getOwnPropertySymbols: function(it) {
      var names = getNames(toObject(it)),
          result = [],
          key,
          i = 0;
      while (names.length > i)
        has(AllSymbols, key = names[i++]) && result.push(AllSymbols[key]);
      return result;
    }
  });
  setTag(Symbol, 'Symbol');
  setTag(Math, 'Math', true);
  setTag($.g.JSON, 'JSON', true);
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.object.assign", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.assign"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.S, 'Object', {assign: require("npm:core-js@0.8.1/library/modules/$.assign")});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.object.set-prototype-of", ["npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.set-proto"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $def = require("npm:core-js@0.8.1/library/modules/$.def");
  $def($def.S, 'Object', {setPrototypeOf: require("npm:core-js@0.8.1/library/modules/$.set-proto")});
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.string.iterator", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.string-at", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.iter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var set = require("npm:core-js@0.8.1/library/modules/$").set,
      at = require("npm:core-js@0.8.1/library/modules/$.string-at")(true),
      ITER = require("npm:core-js@0.8.1/library/modules/$.uid").safe('iter'),
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
      step = $iter.step;
  $iter.std(String, 'String', function(iterated) {
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
    point = at.call(O, index);
    iter.i += point.length;
    return step(0, point);
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.array.iterator", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.unscope", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.iter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      setUnscope = require("npm:core-js@0.8.1/library/modules/$.unscope"),
      ITER = require("npm:core-js@0.8.1/library/modules/$.uid").safe('iter'),
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
      step = $iter.step,
      Iterators = $iter.Iterators;
  $iter.std(Array, 'Array', function(iterated, kind) {
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
    if (kind == 'key')
      return step(0, index);
    if (kind == 'value')
      return step(0, O[index]);
    return step(0, [index, O[index]]);
  }, 'value');
  Iterators.Arguments = Iterators.Array;
  setUnscope('keys');
  setUnscope('values');
  setUnscope('entries');
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.array.species", ["npm:core-js@0.8.1/library/modules/$.species"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  require("npm:core-js@0.8.1/library/modules/$.species")(Array);
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

System.register("npm:core-js@0.8.1/library/modules/es6.map", ["npm:core-js@0.8.1/library/modules/$.collection-strong", "npm:core-js@0.8.1/library/modules/$.collection"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var strong = require("npm:core-js@0.8.1/library/modules/$.collection-strong");
  require("npm:core-js@0.8.1/library/modules/$.collection")('Map', {
    get: function(key) {
      var entry = strong.getEntry(this, key);
      return entry && entry.v;
    },
    set: function(key, value) {
      return strong.def(this, key === 0 ? 0 : key, value);
    }
  }, strong, true);
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.weak-map", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.collection-weak", "npm:core-js@0.8.1/library/modules/$.collection"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      weak = require("npm:core-js@0.8.1/library/modules/$.collection-weak"),
      leakStore = weak.leakStore,
      ID = weak.ID,
      WEAK = weak.WEAK,
      has = $.has,
      isObject = $.isObject,
      isFrozen = Object.isFrozen || $.core.Object.isFrozen,
      tmp = {};
  var WeakMap = require("npm:core-js@0.8.1/library/modules/$.collection")('WeakMap', {
    get: function(key) {
      if (isObject(key)) {
        if (isFrozen(key))
          return leakStore(this).get(key);
        if (has(key, WEAK))
          return key[WEAK][this[ID]];
      }
    },
    set: function(key, value) {
      return weak.def(this, key, value);
    }
  }, weak, true, true);
  if ($.FW && new WeakMap().set((Object.freeze || Object)(tmp), 7).get(tmp) != 7) {
    $.each.call(['delete', 'has', 'get', 'set'], function(key) {
      var method = WeakMap.prototype[key];
      WeakMap.prototype[key] = function(a, b) {
        if (isObject(a) && isFrozen(a)) {
          var result = leakStore(this)[key](a, b);
          return key == 'set' ? this : result;
        }
        return method.call(this, a, b);
      };
    });
  }
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/es6.reflect", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.set-proto", "npm:core-js@0.8.1/library/modules/$.iter", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.ctx", "npm:core-js@0.8.1/library/modules/$.own-keys"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      setProto = require("npm:core-js@0.8.1/library/modules/$.set-proto"),
      $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
      ITER = require("npm:core-js@0.8.1/library/modules/$.uid").safe('iter'),
      step = $iter.step,
      assert = require("npm:core-js@0.8.1/library/modules/$.assert"),
      isObject = $.isObject,
      getDesc = $.getDesc,
      setDesc = $.setDesc,
      getProto = $.getProto,
      apply = Function.apply,
      assertObject = assert.obj,
      isExtensible = Object.isExtensible || $.it;
  function Enumerate(iterated) {
    var keys = [],
        key;
    for (key in iterated)
      keys.push(key);
    $.set(this, ITER, {
      o: iterated,
      a: keys,
      i: 0
    });
  }
  $iter.create(Enumerate, 'Object', function() {
    var iter = this[ITER],
        keys = iter.a,
        key;
    do {
      if (iter.i >= keys.length)
        return step(1);
    } while (!((key = keys[iter.i++]) in iter.o));
    return step(0, key);
  });
  function wrap(fn) {
    return function(it) {
      assertObject(it);
      try {
        fn.apply(undefined, arguments);
        return true;
      } catch (e) {
        return false;
      }
    };
  }
  function reflectGet(target, propertyKey) {
    var receiver = arguments.length < 3 ? target : arguments[2],
        desc = getDesc(assertObject(target), propertyKey),
        proto;
    if (desc)
      return $.has(desc, 'value') ? desc.value : desc.get === undefined ? undefined : desc.get.call(receiver);
    return isObject(proto = getProto(target)) ? reflectGet(proto, propertyKey, receiver) : undefined;
  }
  function reflectSet(target, propertyKey, V) {
    var receiver = arguments.length < 4 ? target : arguments[3],
        ownDesc = getDesc(assertObject(target), propertyKey),
        existingDescriptor,
        proto;
    if (!ownDesc) {
      if (isObject(proto = getProto(target))) {
        return reflectSet(proto, propertyKey, V, receiver);
      }
      ownDesc = $.desc(0);
    }
    if ($.has(ownDesc, 'value')) {
      if (ownDesc.writable === false || !isObject(receiver))
        return false;
      existingDescriptor = getDesc(receiver, propertyKey) || $.desc(0);
      existingDescriptor.value = V;
      setDesc(receiver, propertyKey, existingDescriptor);
      return true;
    }
    return ownDesc.set === undefined ? false : (ownDesc.set.call(receiver, V), true);
  }
  var reflect = {
    apply: require("npm:core-js@0.8.1/library/modules/$.ctx")(Function.call, apply, 3),
    construct: function(target, argumentsList) {
      var proto = assert.fn(arguments.length < 3 ? target : arguments[2]).prototype,
          instance = $.create(isObject(proto) ? proto : Object.prototype),
          result = apply.call(target, instance, argumentsList);
      return isObject(result) ? result : instance;
    },
    defineProperty: wrap(setDesc),
    deleteProperty: function(target, propertyKey) {
      var desc = getDesc(assertObject(target), propertyKey);
      return desc && !desc.configurable ? false : delete target[propertyKey];
    },
    enumerate: function(target) {
      return new Enumerate(assertObject(target));
    },
    get: reflectGet,
    getOwnPropertyDescriptor: function(target, propertyKey) {
      return getDesc(assertObject(target), propertyKey);
    },
    getPrototypeOf: function(target) {
      return getProto(assertObject(target));
    },
    has: function(target, propertyKey) {
      return propertyKey in target;
    },
    isExtensible: function(target) {
      return !!isExtensible(assertObject(target));
    },
    ownKeys: require("npm:core-js@0.8.1/library/modules/$.own-keys"),
    preventExtensions: wrap(Object.preventExtensions || $.it),
    set: reflectSet
  };
  if (setProto)
    reflect.setPrototypeOf = function(target, proto) {
      setProto(assertObject(target), proto);
      return true;
    };
  $def($def.G, {Reflect: {}});
  $def($def.S, 'Reflect', reflect);
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/web.timers", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.invoke", "npm:core-js@0.8.1/library/modules/$.partial"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      invoke = require("npm:core-js@0.8.1/library/modules/$.invoke"),
      partial = require("npm:core-js@0.8.1/library/modules/$.partial"),
      MSIE = !!$.g.navigator && /MSIE .\./.test(navigator.userAgent);
  function wrap(set) {
    return MSIE ? function(fn, time) {
      return set(invoke(partial, [].slice.call(arguments, 2), $.isFunction(fn) ? fn : Function(fn)), time);
    } : set;
  }
  $def($def.G + $def.B + $def.F * MSIE, {
    setTimeout: wrap($.g.setTimeout),
    setInterval: wrap($.g.setInterval)
  });
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/modules/$.cof", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.wks"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      TAG = require("npm:core-js@0.8.1/library/modules/$.wks")('toStringTag'),
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

System.register("npm:core-js@0.8.1/library/modules/$.array-methods", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.ctx"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      ctx = require("npm:core-js@0.8.1/library/modules/$.ctx");
  module.exports = function(TYPE) {
    var IS_MAP = TYPE == 1,
        IS_FILTER = TYPE == 2,
        IS_SOME = TYPE == 3,
        IS_EVERY = TYPE == 4,
        IS_FIND_INDEX = TYPE == 6,
        NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
    return function(callbackfn) {
      var O = Object($.assertDefined(this)),
          self = $.ES5Object(O),
          f = ctx(callbackfn, arguments[1], 3),
          length = $.toLength(self.length),
          index = 0,
          result = IS_MAP ? Array(length) : IS_FILTER ? [] : undefined,
          val,
          res;
      for (; length > index; index++)
        if (NO_HOLES || index in self) {
          val = self[index];
          res = f(val, index, O);
          if (TYPE) {
            if (IS_MAP)
              result[index] = res;
            else if (res)
              switch (TYPE) {
                case 3:
                  return true;
                case 5:
                  return val;
                case 6:
                  return index;
                case 2:
                  result.push(val);
              }
            else if (IS_EVERY)
              return false;
          }
        }
      return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
    };
  };
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

System.register("npm:core-js@0.8.1/library/modules/es5", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.invoke", "npm:core-js@0.8.1/library/modules/$.array-methods", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.array-includes", "npm:core-js@0.8.1/library/modules/$.replacer"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@0.8.1/library/modules/$"),
      cof = require("npm:core-js@0.8.1/library/modules/$.cof"),
      $def = require("npm:core-js@0.8.1/library/modules/$.def"),
      invoke = require("npm:core-js@0.8.1/library/modules/$.invoke"),
      arrayMethod = require("npm:core-js@0.8.1/library/modules/$.array-methods"),
      IE_PROTO = require("npm:core-js@0.8.1/library/modules/$.uid").safe('__proto__'),
      assert = require("npm:core-js@0.8.1/library/modules/$.assert"),
      assertObject = assert.obj,
      ObjectProto = Object.prototype,
      A = [],
      slice = A.slice,
      indexOf = A.indexOf,
      classof = cof.classof,
      defineProperties = Object.defineProperties,
      has = $.has,
      defineProperty = $.setDesc,
      getOwnDescriptor = $.getDesc,
      isFunction = $.isFunction,
      toObject = $.toObject,
      toLength = $.toLength,
      IE8_DOM_DEFINE = false;
  if (!$.DESC) {
    try {
      IE8_DOM_DEFINE = defineProperty(document.createElement('div'), 'x', {get: function() {
          return 8;
        }}).x == 8;
    } catch (e) {}
    $.setDesc = function(O, P, Attributes) {
      if (IE8_DOM_DEFINE)
        try {
          return defineProperty(O, P, Attributes);
        } catch (e) {}
      if ('get' in Attributes || 'set' in Attributes)
        throw TypeError('Accessors not supported!');
      if ('value' in Attributes)
        assertObject(O)[P] = Attributes.value;
      return O;
    };
    $.getDesc = function(O, P) {
      if (IE8_DOM_DEFINE)
        try {
          return getOwnDescriptor(O, P);
        } catch (e) {}
      if (has(O, P))
        return $.desc(!ObjectProto.propertyIsEnumerable.call(O, P), O[P]);
    };
    defineProperties = function(O, Properties) {
      assertObject(O);
      var keys = $.getKeys(Properties),
          length = keys.length,
          i = 0,
          P;
      while (length > i)
        $.setDesc(O, P = keys[i++], Properties[P]);
      return O;
    };
  }
  $def($def.S + $def.F * !$.DESC, 'Object', {
    getOwnPropertyDescriptor: $.getDesc,
    defineProperty: $.setDesc,
    defineProperties: defineProperties
  });
  var keys1 = ('constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,' + 'toLocaleString,toString,valueOf').split(','),
      keys2 = keys1.concat('length', 'prototype'),
      keysLen1 = keys1.length;
  var createDict = function() {
    var iframe = document.createElement('iframe'),
        i = keysLen1,
        iframeDocument;
    iframe.style.display = 'none';
    $.html.appendChild(iframe);
    iframe.src = 'javascript:';
    iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write('<script>document.F=Object</script>');
    iframeDocument.close();
    createDict = iframeDocument.F;
    while (i--)
      delete createDict.prototype[keys1[i]];
    return createDict();
  };
  function createGetKeys(names, length) {
    return function(object) {
      var O = toObject(object),
          i = 0,
          result = [],
          key;
      for (key in O)
        if (key != IE_PROTO)
          has(O, key) && result.push(key);
      while (length > i)
        if (has(O, key = names[i++])) {
          ~indexOf.call(result, key) || result.push(key);
        }
      return result;
    };
  }
  function isPrimitive(it) {
    return !$.isObject(it);
  }
  function Empty() {}
  $def($def.S, 'Object', {
    getPrototypeOf: $.getProto = $.getProto || function(O) {
      O = Object(assert.def(O));
      if (has(O, IE_PROTO))
        return O[IE_PROTO];
      if (isFunction(O.constructor) && O instanceof O.constructor) {
        return O.constructor.prototype;
      }
      return O instanceof Object ? ObjectProto : null;
    },
    getOwnPropertyNames: $.getNames = $.getNames || createGetKeys(keys2, keys2.length, true),
    create: $.create = $.create || function(O, Properties) {
      var result;
      if (O !== null) {
        Empty.prototype = assertObject(O);
        result = new Empty();
        Empty.prototype = null;
        result[IE_PROTO] = O;
      } else
        result = createDict();
      return Properties === undefined ? result : defineProperties(result, Properties);
    },
    keys: $.getKeys = $.getKeys || createGetKeys(keys1, keysLen1, false),
    seal: $.it,
    freeze: $.it,
    preventExtensions: $.it,
    isSealed: isPrimitive,
    isFrozen: isPrimitive,
    isExtensible: $.isObject
  });
  $def($def.P, 'Function', {bind: function(that) {
      var fn = assert.fn(this),
          partArgs = slice.call(arguments, 1);
      function bound() {
        var args = partArgs.concat(slice.call(arguments));
        return invoke(fn, args, this instanceof bound ? $.create(fn.prototype) : that);
      }
      if (fn.prototype)
        bound.prototype = fn.prototype;
      return bound;
    }});
  function arrayMethodFix(fn) {
    return function() {
      return fn.apply($.ES5Object(this), arguments);
    };
  }
  if (!(0 in Object('z') && 'z'[0] == 'z')) {
    $.ES5Object = function(it) {
      return cof(it) == 'String' ? it.split('') : Object(it);
    };
  }
  $def($def.P + $def.F * ($.ES5Object != Object), 'Array', {
    slice: arrayMethodFix(slice),
    join: arrayMethodFix(A.join)
  });
  $def($def.S, 'Array', {isArray: function(arg) {
      return cof(arg) == 'Array';
    }});
  function createArrayReduce(isRight) {
    return function(callbackfn, memo) {
      assert.fn(callbackfn);
      var O = toObject(this),
          length = toLength(O.length),
          index = isRight ? length - 1 : 0,
          i = isRight ? -1 : 1;
      if (arguments.length < 2)
        for (; ; ) {
          if (index in O) {
            memo = O[index];
            index += i;
            break;
          }
          index += i;
          assert(isRight ? index >= 0 : length > index, 'Reduce of empty array with no initial value');
        }
      for (; isRight ? index >= 0 : length > index; index += i)
        if (index in O) {
          memo = callbackfn(memo, O[index], index, this);
        }
      return memo;
    };
  }
  $def($def.P, 'Array', {
    forEach: $.each = $.each || arrayMethod(0),
    map: arrayMethod(1),
    filter: arrayMethod(2),
    some: arrayMethod(3),
    every: arrayMethod(4),
    reduce: createArrayReduce(false),
    reduceRight: createArrayReduce(true),
    indexOf: indexOf = indexOf || require("npm:core-js@0.8.1/library/modules/$.array-includes")(false),
    lastIndexOf: function(el, fromIndex) {
      var O = toObject(this),
          length = toLength(O.length),
          index = length - 1;
      if (arguments.length > 1)
        index = Math.min(index, $.toInteger(fromIndex));
      if (index < 0)
        index = toLength(length + index);
      for (; index >= 0; index--)
        if (index in O)
          if (O[index] === el)
            return index;
      return -1;
    }
  });
  $def($def.P, 'String', {trim: require("npm:core-js@0.8.1/library/modules/$.replacer")(/^\s*([\s\S]*\S)?\s*$/, '$1')});
  $def($def.S, 'Date', {now: function() {
      return +new Date;
    }});
  function lz(num) {
    return num > 9 ? num : '0' + num;
  }
  $def($def.P, 'Date', {toISOString: function() {
      if (!isFinite(this))
        throw RangeError('Invalid time value');
      var d = this,
          y = d.getUTCFullYear(),
          m = d.getUTCMilliseconds(),
          s = y < 0 ? '-' : y > 9999 ? '+' : '';
      return s + ('00000' + Math.abs(y)).slice(s ? -6 : -4) + '-' + lz(d.getUTCMonth() + 1) + '-' + lz(d.getUTCDate()) + 'T' + lz(d.getUTCHours()) + ':' + lz(d.getUTCMinutes()) + ':' + lz(d.getUTCSeconds()) + '.' + (m > 99 ? m : '0' + lz(m)) + 'Z';
    }});
  if (classof(function() {
    return arguments;
  }()) == 'Object')
    cof.classof = function(it) {
      var tag = classof(it);
      return tag == 'Object' && isFunction(it.callee) ? 'Arguments' : tag;
    };
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

System.register("npm:core-js@0.8.1/library/modules/$.task", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.ctx", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.invoke", "github:jspm/nodelibs-process@0.1.1"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var $ = require("npm:core-js@0.8.1/library/modules/$"),
        ctx = require("npm:core-js@0.8.1/library/modules/$.ctx"),
        cof = require("npm:core-js@0.8.1/library/modules/$.cof"),
        invoke = require("npm:core-js@0.8.1/library/modules/$.invoke"),
        global = $.g,
        isFunction = $.isFunction,
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
      if (cof(global.process) == 'process') {
        defer = function(id) {
          global.process.nextTick(ctx(run, id, 1));
        };
      } else if (addEventListener && isFunction(postMessage) && !$.g.importScripts) {
        defer = function(id) {
          postMessage(id, '*');
        };
        addEventListener('message', listner, false);
      } else if (isFunction(MessageChannel)) {
        channel = new MessageChannel;
        port = channel.port2;
        channel.port1.onmessage = listner;
        defer = ctx(port.postMessage, port, 1);
      } else if ($.g.document && ONREADYSTATECHANGE in document.createElement('script')) {
        defer = function(id) {
          $.html.appendChild(document.createElement('script'))[ONREADYSTATECHANGE] = function() {
            $.html.removeChild(this);
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

System.register("npm:core-js@0.8.1/library/modules/es6.promise", ["npm:core-js@0.8.1/library/modules/$", "npm:core-js@0.8.1/library/modules/$.ctx", "npm:core-js@0.8.1/library/modules/$.cof", "npm:core-js@0.8.1/library/modules/$.def", "npm:core-js@0.8.1/library/modules/$.assert", "npm:core-js@0.8.1/library/modules/$.iter", "npm:core-js@0.8.1/library/modules/$.wks", "npm:core-js@0.8.1/library/modules/$.uid", "npm:core-js@0.8.1/library/modules/$.task", "npm:core-js@0.8.1/library/modules/$.species", "github:jspm/nodelibs-process@0.1.1"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var $ = require("npm:core-js@0.8.1/library/modules/$"),
        ctx = require("npm:core-js@0.8.1/library/modules/$.ctx"),
        cof = require("npm:core-js@0.8.1/library/modules/$.cof"),
        $def = require("npm:core-js@0.8.1/library/modules/$.def"),
        assert = require("npm:core-js@0.8.1/library/modules/$.assert"),
        $iter = require("npm:core-js@0.8.1/library/modules/$.iter"),
        SPECIES = require("npm:core-js@0.8.1/library/modules/$.wks")('species'),
        RECORD = require("npm:core-js@0.8.1/library/modules/$.uid").safe('record'),
        forOf = $iter.forOf,
        PROMISE = 'Promise',
        global = $.g,
        process = global.process,
        asap = process && process.nextTick || require("npm:core-js@0.8.1/library/modules/$.task").set,
        Promise = global[PROMISE],
        Base = Promise,
        isFunction = $.isFunction,
        isObject = $.isObject,
        assertFunction = assert.fn,
        assertObject = assert.obj,
        test;
    function getConstructor(C) {
      var S = assertObject(C)[SPECIES];
      return S != undefined ? S : C;
    }
    isFunction(Promise) && isFunction(Promise.resolve) && Promise.resolve(test = new Promise(function() {})) == test || function() {
      function isThenable(it) {
        var then;
        if (isObject(it))
          then = it.then;
        return isFunction(then) ? then : false;
      }
      function handledRejectionOrHasOnRejected(promise) {
        var record = promise[RECORD],
            chain = record.c,
            i = 0,
            react;
        if (record.h)
          return true;
        while (chain.length > i) {
          react = chain[i++];
          if (react.fail || handledRejectionOrHasOnRejected(react.P))
            return true;
        }
      }
      function notify(record, isReject) {
        var chain = record.c;
        if (isReject || chain.length)
          asap(function() {
            var promise = record.p,
                value = record.v,
                ok = record.s == 1,
                i = 0;
            if (isReject && !handledRejectionOrHasOnRejected(promise)) {
              setTimeout(function() {
                if (!handledRejectionOrHasOnRejected(promise)) {
                  if (cof(process) == 'process') {
                    process.emit('unhandledRejection', value, promise);
                  } else if (global.console && isFunction(console.error)) {
                    console.error('Unhandled promise rejection', value);
                  }
                }
              }, 1e3);
            } else
              while (chain.length > i)
                !function(react) {
                  var cb = ok ? react.ok : react.fail,
                      ret,
                      then;
                  try {
                    if (cb) {
                      if (!ok)
                        record.h = true;
                      ret = cb === true ? value : cb(value);
                      if (ret === react.P) {
                        react.rej(TypeError(PROMISE + '-chain cycle'));
                      } else if (then = isThenable(ret)) {
                        then.call(ret, react.res, react.rej);
                      } else
                        react.res(ret);
                    } else
                      react.rej(value);
                  } catch (err) {
                    react.rej(err);
                  }
                }(chain[i++]);
            chain.length = 0;
          });
      }
      function reject(value) {
        var record = this;
        if (record.d)
          return ;
        record.d = true;
        record = record.r || record;
        record.v = value;
        record.s = 2;
        notify(record, true);
      }
      function resolve(value) {
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
            then.call(value, ctx(resolve, wrapper, 1), ctx(reject, wrapper, 1));
          } else {
            record.v = value;
            record.s = 1;
            notify(record);
          }
        } catch (err) {
          reject.call(wrapper || {
            r: record,
            d: false
          }, err);
        }
      }
      Promise = function(executor) {
        assertFunction(executor);
        var record = {
          p: assert.inst(this, Promise, PROMISE),
          c: [],
          s: 0,
          d: false,
          v: undefined,
          h: false
        };
        $.hide(this, RECORD, record);
        try {
          executor(ctx(resolve, record, 1), ctx(reject, record, 1));
        } catch (err) {
          reject.call(record, err);
        }
      };
      $.mix(Promise.prototype, {
        then: function(onFulfilled, onRejected) {
          var S = assertObject(assertObject(this).constructor)[SPECIES];
          var react = {
            ok: isFunction(onFulfilled) ? onFulfilled : true,
            fail: isFunction(onRejected) ? onRejected : false
          };
          var P = react.P = new (S != undefined ? S : Promise)(function(res, rej) {
            react.res = assertFunction(res);
            react.rej = assertFunction(rej);
          });
          var record = this[RECORD];
          record.c.push(react);
          record.s && notify(record);
          return P;
        },
        'catch': function(onRejected) {
          return this.then(undefined, onRejected);
        }
      });
    }();
    $def($def.G + $def.W + $def.F * (Promise != Base), {Promise: Promise});
    $def($def.S, PROMISE, {
      reject: function(r) {
        return new (getConstructor(this))(function(res, rej) {
          rej(r);
        });
      },
      resolve: function(x) {
        return isObject(x) && RECORD in x && $.getProto(x) === this.prototype ? x : new (getConstructor(this))(function(res) {
          res(x);
        });
      }
    });
    $def($def.S + $def.F * ($iter.fail(function(iter) {
      Promise.all(iter)['catch'](function() {});
    }) || $iter.DANGER_CLOSING), PROMISE, {
      all: function(iterable) {
        var C = getConstructor(this),
            values = [];
        return new C(function(resolve, reject) {
          forOf(iterable, false, values.push, values);
          var remaining = values.length,
              results = Array(remaining);
          if (remaining)
            $.each.call(values, function(promise, index) {
              C.resolve(promise).then(function(value) {
                results[index] = value;
                --remaining || resolve(results);
              }, reject);
            });
          else
            resolve(results);
        });
      },
      race: function(iterable) {
        var C = getConstructor(this);
        return new C(function(resolve, reject) {
          forOf(iterable, false, function(promise) {
            C.resolve(promise).then(resolve, reject);
          });
        });
      }
    });
    cof.set(Promise, PROMISE);
    require("npm:core-js@0.8.1/library/modules/$.species")(Promise);
  })(require("github:jspm/nodelibs-process@0.1.1"));
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/shim", ["npm:core-js@0.8.1/library/modules/es5", "npm:core-js@0.8.1/library/modules/es6.symbol", "npm:core-js@0.8.1/library/modules/es6.object.assign", "npm:core-js@0.8.1/library/modules/es6.object.is", "npm:core-js@0.8.1/library/modules/es6.object.set-prototype-of", "npm:core-js@0.8.1/library/modules/es6.object.to-string", "npm:core-js@0.8.1/library/modules/es6.object.statics-accept-primitives", "npm:core-js@0.8.1/library/modules/es6.function.name", "npm:core-js@0.8.1/library/modules/es6.number.constructor", "npm:core-js@0.8.1/library/modules/es6.number.statics", "npm:core-js@0.8.1/library/modules/es6.math", "npm:core-js@0.8.1/library/modules/es6.string.from-code-point", "npm:core-js@0.8.1/library/modules/es6.string.raw", "npm:core-js@0.8.1/library/modules/es6.string.iterator", "npm:core-js@0.8.1/library/modules/es6.string.code-point-at", "npm:core-js@0.8.1/library/modules/es6.string.ends-with", "npm:core-js@0.8.1/library/modules/es6.string.includes", "npm:core-js@0.8.1/library/modules/es6.string.repeat", "npm:core-js@0.8.1/library/modules/es6.string.starts-with", "npm:core-js@0.8.1/library/modules/es6.array.from", "npm:core-js@0.8.1/library/modules/es6.array.of", "npm:core-js@0.8.1/library/modules/es6.array.iterator", "npm:core-js@0.8.1/library/modules/es6.array.species", "npm:core-js@0.8.1/library/modules/es6.array.copy-within", "npm:core-js@0.8.1/library/modules/es6.array.fill", "npm:core-js@0.8.1/library/modules/es6.array.find", "npm:core-js@0.8.1/library/modules/es6.array.find-index", "npm:core-js@0.8.1/library/modules/es6.regexp", "npm:core-js@0.8.1/library/modules/es6.promise", "npm:core-js@0.8.1/library/modules/es6.map", "npm:core-js@0.8.1/library/modules/es6.set", "npm:core-js@0.8.1/library/modules/es6.weak-map", "npm:core-js@0.8.1/library/modules/es6.weak-set", "npm:core-js@0.8.1/library/modules/es6.reflect", "npm:core-js@0.8.1/library/modules/es7.array.includes", "npm:core-js@0.8.1/library/modules/es7.string.at", "npm:core-js@0.8.1/library/modules/es7.regexp.escape", "npm:core-js@0.8.1/library/modules/es7.object.get-own-property-descriptors", "npm:core-js@0.8.1/library/modules/es7.object.to-array", "npm:core-js@0.8.1/library/modules/js.array.statics", "npm:core-js@0.8.1/library/modules/web.timers", "npm:core-js@0.8.1/library/modules/web.immediate", "npm:core-js@0.8.1/library/modules/web.dom.iterable", "npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  require("npm:core-js@0.8.1/library/modules/es5");
  require("npm:core-js@0.8.1/library/modules/es6.symbol");
  require("npm:core-js@0.8.1/library/modules/es6.object.assign");
  require("npm:core-js@0.8.1/library/modules/es6.object.is");
  require("npm:core-js@0.8.1/library/modules/es6.object.set-prototype-of");
  require("npm:core-js@0.8.1/library/modules/es6.object.to-string");
  require("npm:core-js@0.8.1/library/modules/es6.object.statics-accept-primitives");
  require("npm:core-js@0.8.1/library/modules/es6.function.name");
  require("npm:core-js@0.8.1/library/modules/es6.number.constructor");
  require("npm:core-js@0.8.1/library/modules/es6.number.statics");
  require("npm:core-js@0.8.1/library/modules/es6.math");
  require("npm:core-js@0.8.1/library/modules/es6.string.from-code-point");
  require("npm:core-js@0.8.1/library/modules/es6.string.raw");
  require("npm:core-js@0.8.1/library/modules/es6.string.iterator");
  require("npm:core-js@0.8.1/library/modules/es6.string.code-point-at");
  require("npm:core-js@0.8.1/library/modules/es6.string.ends-with");
  require("npm:core-js@0.8.1/library/modules/es6.string.includes");
  require("npm:core-js@0.8.1/library/modules/es6.string.repeat");
  require("npm:core-js@0.8.1/library/modules/es6.string.starts-with");
  require("npm:core-js@0.8.1/library/modules/es6.array.from");
  require("npm:core-js@0.8.1/library/modules/es6.array.of");
  require("npm:core-js@0.8.1/library/modules/es6.array.iterator");
  require("npm:core-js@0.8.1/library/modules/es6.array.species");
  require("npm:core-js@0.8.1/library/modules/es6.array.copy-within");
  require("npm:core-js@0.8.1/library/modules/es6.array.fill");
  require("npm:core-js@0.8.1/library/modules/es6.array.find");
  require("npm:core-js@0.8.1/library/modules/es6.array.find-index");
  require("npm:core-js@0.8.1/library/modules/es6.regexp");
  require("npm:core-js@0.8.1/library/modules/es6.promise");
  require("npm:core-js@0.8.1/library/modules/es6.map");
  require("npm:core-js@0.8.1/library/modules/es6.set");
  require("npm:core-js@0.8.1/library/modules/es6.weak-map");
  require("npm:core-js@0.8.1/library/modules/es6.weak-set");
  require("npm:core-js@0.8.1/library/modules/es6.reflect");
  require("npm:core-js@0.8.1/library/modules/es7.array.includes");
  require("npm:core-js@0.8.1/library/modules/es7.string.at");
  require("npm:core-js@0.8.1/library/modules/es7.regexp.escape");
  require("npm:core-js@0.8.1/library/modules/es7.object.get-own-property-descriptors");
  require("npm:core-js@0.8.1/library/modules/es7.object.to-array");
  require("npm:core-js@0.8.1/library/modules/js.array.statics");
  require("npm:core-js@0.8.1/library/modules/web.timers");
  require("npm:core-js@0.8.1/library/modules/web.immediate");
  require("npm:core-js@0.8.1/library/modules/web.dom.iterable");
  module.exports = require("npm:core-js@0.8.1/library/modules/$").core;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library/index", ["npm:core-js@0.8.1/library/shim", "npm:core-js@0.8.1/library/modules/core.dict", "npm:core-js@0.8.1/library/modules/core.iter-helpers", "npm:core-js@0.8.1/library/modules/core.$for", "npm:core-js@0.8.1/library/modules/core.delay", "npm:core-js@0.8.1/library/modules/core.binding", "npm:core-js@0.8.1/library/modules/core.object", "npm:core-js@0.8.1/library/modules/core.array.turn", "npm:core-js@0.8.1/library/modules/core.number.iterator", "npm:core-js@0.8.1/library/modules/core.number.math", "npm:core-js@0.8.1/library/modules/core.string.escape-html", "npm:core-js@0.8.1/library/modules/core.date", "npm:core-js@0.8.1/library/modules/core.global", "npm:core-js@0.8.1/library/modules/core.log", "npm:core-js@0.8.1/library/modules/$"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  require("npm:core-js@0.8.1/library/shim");
  require("npm:core-js@0.8.1/library/modules/core.dict");
  require("npm:core-js@0.8.1/library/modules/core.iter-helpers");
  require("npm:core-js@0.8.1/library/modules/core.$for");
  require("npm:core-js@0.8.1/library/modules/core.delay");
  require("npm:core-js@0.8.1/library/modules/core.binding");
  require("npm:core-js@0.8.1/library/modules/core.object");
  require("npm:core-js@0.8.1/library/modules/core.array.turn");
  require("npm:core-js@0.8.1/library/modules/core.number.iterator");
  require("npm:core-js@0.8.1/library/modules/core.number.math");
  require("npm:core-js@0.8.1/library/modules/core.string.escape-html");
  require("npm:core-js@0.8.1/library/modules/core.date");
  require("npm:core-js@0.8.1/library/modules/core.global");
  require("npm:core-js@0.8.1/library/modules/core.log");
  module.exports = require("npm:core-js@0.8.1/library/modules/$").core;
  global.define = __define;
  return module.exports;
});

System.register("npm:core-js@0.8.1/library", ["npm:core-js@0.8.1/library/index"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:core-js@0.8.1/library/index");
  global.define = __define;
  return module.exports;
});

System.register("npm:babel-runtime@5.0.12/core-js", ["npm:core-js@0.8.1/library"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": require("npm:core-js@0.8.1/library"),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

System.register("src/org/core/events/EventMap", [], function (_export) {
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

            _export("default", EventMap);
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

            _export('default', Signal);
        }
    };
});
System.register("src/org/core/display/DomWatcher", ["src/org/core/events/Signal"], function (_export) {
    var Signal;

    function DomWatcher() {
        var onAdded = Signal();
        var onRemoved = Signal();

        var handleMutations = function handleMutations(mutations) {
            var response = mutations.reduce(function (result, mutation) {
                result.addedNodes = result.addedNodes.concat(Array.prototype.slice.call(mutation.addedNodes));
                result.removedNodes = result.removedNodes.concat(Array.prototype.slice.call(mutation.removedNodes));
                return result;
            }, { addedNodes: [], removedNodes: [] });

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
        }],
        execute: function () {
            "use strict";

            _export("default", DomWatcher);

            ;
        }
    };
});
System.register("src/org/core/display/Mediator", [], function (_export) {
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

            _export("default", Mediator);
        }
    };
});
System.register("src/org/core/display/MediatorsBuilder", ["npm:babel-runtime@5.0.12/core-js", "src/org/core/core", "src/org/core/events/Signal"], function (_export) {
    var _core, RoboJS, Signal;

    function MediatorsBuilder(domWatcher, loader, mediatorHandler, definitions) {
        var onAdded = Signal(),
            onRemoved = Signal(),
            _emitAddedSignal = function _emitAddedSignal(mediators) {
            if (mediators.length) onAdded.emit(mediators);
        },
            _filterDefinitions = function _filterDefinitions(node, def) {
            return node.getAttribute("data-mediator") == def.id;
        },
            _createMediator = function _createMediator(node, def) {
            return loader.load(def.mediator).then(mediatorHandler.create.bind(null, node, def));
        },
            _findMediators = function _findMediators(result, node) {
            return result.concat(definitions.filter(_filterDefinitions.bind(null, node)).map(_createMediator.bind(null, node)));
        },
            _reduceNodes = function _reduceNodes(result, node) {
            if (!node || !node.getElementsByTagName) {
                return result;
            }var n = [].slice.call(node.getElementsByTagName("*"), 0);
            n.unshift(node);
            return result.concat(n);
        },
            _destroyMediator = function _destroyMediator(node) {
            var mediator = mediatorHandler.destroy(node);
            mediator && onRemoved.emit(mediator);
        },
            getMediators = function getMediators(target) {
            return _core.Promise.all(target.reduce(_reduceNodes, []).reduce(_findMediators, []));
        },
            _handleNodesAdded = function _handleNodesAdded(nodes) {
            return getMediators(nodes).then(_emitAddedSignal);
        },
            _handleNodesRemoved = function _handleNodesRemoved(nodes) {
            return nodes.reduce(_reduceNodes, []).forEach(_destroyMediator);
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
        setters: [function (_npmBabelRuntime5012CoreJs) {
            _core = _npmBabelRuntime5012CoreJs["default"];
        }, function (_srcOrgCoreCore) {
            RoboJS = _srcOrgCoreCore["default"];
        }, function (_srcOrgCoreEventsSignal) {
            Signal = _srcOrgCoreEventsSignal["default"];
        }],
        execute: function () {
            "use strict";

            _export("default", MediatorsBuilder);
        }
    };
});
System.register("src/org/core/display/MediatorHandler", ["src/org/core/core", "src/org/core/events/EventDispatcher", "src/org/core/events/EventMap"], function (_export) {
    var RoboJS, EventDispatcher, EventMap;
    return {
        setters: [function (_srcOrgCoreCore) {
            RoboJS = _srcOrgCoreCore["default"];
        }, function (_srcOrgCoreEventsEventDispatcher) {
            EventDispatcher = _srcOrgCoreEventsEventDispatcher["default"];
        }, function (_srcOrgCoreEventsEventMap) {
            EventMap = _srcOrgCoreEventsEventMap["default"];
        }],
        execute: function () {
            /**
             * Created by marco.gobbi on 21/01/2015.
             */
            "use strict";

            _export("default", {
                create: function create(node, def, Mediator) {
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
                },
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

            _export("default", bootstrap);

            ;
        }
    };
});
/**
 * Created by marco.gobbi on 21/01/2015.
 */
System.register("src/org/core/net/ScriptLoader", ["npm:babel-runtime@5.0.12/core-js"], function (_export) {
    var _core;

    return {
        setters: [function (_npmBabelRuntime5012CoreJs) {
            _core = _npmBabelRuntime5012CoreJs["default"];
        }],
        execute: function () {
            //var System = require('es6-module-loader').System;
            "use strict";

            _export("default", {
                load: function load(id) {
                    return new _core.Promise(function (resolve, reject) {
                        window.require([id], function (Mediator) {
                            resolve(Mediator);
                        });
                    });
                }
            });
        }
    };
});
System.register("src/org/core/core", ["src/org/core/net/ScriptLoader", "src/org/core/events/EventMap", "src/org/core/events/EventDispatcher", "src/org/core/events/Signal", "src/org/core/display/DomWatcher", "src/org/core/display/Mediator", "src/org/core/display/MediatorsBuilder", "src/org/core/display/bootstrap", "src/org/core/display/MediatorHandler"], function (_export) {
    var ScriptLoader, EventMap, EventDispatcher, Signal, DomWatcher, Mediator, MediatorsBuilder, bootstrap, MediatorHandler, uid, flip, robojs;

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
                    ScriptLoader: ScriptLoader
                }

            };

            if (typeof define === "function" && define.amd) {
                // AMD. Register as an anonymous module.
                define([], function () {
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