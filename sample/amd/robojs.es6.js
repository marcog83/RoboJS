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

System.register("npm:ramda@0.13.0", ["npm:ramda@0.13.0/dist/ramda"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:ramda@0.13.0/dist/ramda");
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
System.register("src/org/core/display/MediatorsBuilder", ["npm:babel-runtime@5.0.12/core-js", "src/org/core/core", "src/org/core/events/Signal", "npm:ramda@0.13.0"], function (_export) {
    var _core, RoboJS, Signal, R;

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
            return loader.load(def.mediator).then(mediatorHandler.create.bind(null, node, def));
        }),
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
            _handleNodesRemoved = R.compose(R.forEach(_destroyMediator), R.reduce(_reduceNodes, []));

        var _findMediators = function _findMediators(result, node) {
            "use strict";
            var _composedFindMediator = R.compose(R.map(_createMediator(node)), R.filter(_filterDefinitions(node)));
            return result.concat(_composedFindMediator(definitions));
        };

        var _promiseReduce = R.compose(R.reduce(_findMediators, []), R.reduce(_reduceNodes, []));
        var getMediators = function getMediators(target) {
            return _core.Promise.all(_promiseReduce(target));
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
        setters: [function (_npmBabelRuntime5012CoreJs) {
            _core = _npmBabelRuntime5012CoreJs["default"];
        }, function (_srcOrgCoreCore) {
            RoboJS = _srcOrgCoreCore["default"];
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
System.register("src/org/core/display/DomWatcher", ["src/org/core/events/Signal", "npm:ramda@0.13.0"], function (_export) {
    var Signal, R;

    function DomWatcher() {
        var onAdded = Signal();
        var onRemoved = Signal();
        var _handleMutations = R.reduce(function (result, mutation) {
            result.addedNodes = result.addedNodes.concat(Array.prototype.slice.call(mutation.addedNodes));
            result.removedNodes = result.removedNodes.concat(Array.prototype.slice.call(mutation.removedNodes));
            return result;
        }, { addedNodes: [], removedNodes: [] });

        var handleMutations = function handleMutations(mutations) {
            var response = _handleMutations(mutations);
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

            _export("default", DomWatcher);

            ;
        }
    };
});
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