!function(e){function r(e,r,o){return 4===arguments.length?t.apply(this,arguments):void n(e,{declarative:!0,deps:r,declare:o})}function t(e,r,t,o){n(e,{declarative:!1,deps:r,executingRequire:t,execute:o})}function n(e,r){r.name=e,e in v||(v[e]=r),r.normalizedDeps=r.deps}function o(e,r){if(r[e.groupIndex]=r[e.groupIndex]||[],-1==g.call(r[e.groupIndex],e)){r[e.groupIndex].push(e);for(var t=0,n=e.normalizedDeps.length;n>t;t++){var a=e.normalizedDeps[t],u=v[a];if(u&&!u.evaluated){var d=e.groupIndex+(u.declarative!=e.declarative);if(void 0===u.groupIndex||u.groupIndex<d){if(void 0!==u.groupIndex&&(r[u.groupIndex].splice(g.call(r[u.groupIndex],u),1),0==r[u.groupIndex].length))throw new TypeError("Mixed dependency cycle detected");u.groupIndex=d}o(u,r)}}}}function a(e){var r=v[e];r.groupIndex=0;var t=[];o(r,t);for(var n=!!r.declarative==t.length%2,a=t.length-1;a>=0;a--){for(var u=t[a],i=0;i<u.length;i++){var s=u[i];n?d(s):l(s)}n=!n}}function u(e){return y[e]||(y[e]={name:e,dependencies:[],exports:{},importers:[]})}function d(r){if(!r.module){var t=r.module=u(r.name),n=r.module.exports,o=r.declare.call(e,function(e,r){if(t.locked=!0,"object"==typeof e)for(var o in e)n[o]=e[o];else n[e]=r;for(var a=0,u=t.importers.length;u>a;a++){var d=t.importers[a];if(!d.locked)for(var i=0;i<d.dependencies.length;++i)d.dependencies[i]===t&&d.setters[i](n)}return t.locked=!1,r},{id:r.name});t.setters=o.setters,t.execute=o.execute;for(var a=0,i=r.normalizedDeps.length;i>a;a++){var l,s=r.normalizedDeps[a],c=v[s],f=y[s];f?l=f.exports:c&&!c.declarative?l=c.esModule:c?(d(c),f=c.module,l=f.exports):l=p(s),f&&f.importers?(f.importers.push(t),t.dependencies.push(f)):t.dependencies.push(null),t.setters[a]&&t.setters[a](l)}}}function i(e){var r,t=v[e];if(t)t.declarative?f(e,[]):t.evaluated||l(t),r=t.module.exports;else if(r=p(e),!r)throw new Error("Unable to load dependency "+e+".");return(!t||t.declarative)&&r&&r.__useDefault?r["default"]:r}function l(r){if(!r.module){var t={},n=r.module={exports:t,id:r.name};if(!r.executingRequire)for(var o=0,a=r.normalizedDeps.length;a>o;o++){var u=r.normalizedDeps[o],d=v[u];d&&l(d)}r.evaluated=!0;var c=r.execute.call(e,function(e){for(var t=0,n=r.deps.length;n>t;t++)if(r.deps[t]==e)return i(r.normalizedDeps[t]);throw new TypeError("Module "+e+" not declared as a dependency.")},t,n);void 0!==c&&(n.exports=c),t=n.exports,t&&t.__esModule?r.esModule=t:r.esModule=s(t)}}function s(r){var t={};if(("object"==typeof r||"function"==typeof r)&&r!==e)if(m)for(var n in r)"default"!==n&&c(t,r,n);else{var o=r&&r.hasOwnProperty;for(var n in r)"default"===n||o&&!r.hasOwnProperty(n)||(t[n]=r[n])}return t["default"]=r,x(t,"__useDefault",{value:!0}),t}function c(e,r,t){try{var n;(n=Object.getOwnPropertyDescriptor(r,t))&&x(e,t,n)}catch(o){return e[t]=r[t],!1}}function f(r,t){var n=v[r];if(n&&!n.evaluated&&n.declarative){t.push(r);for(var o=0,a=n.normalizedDeps.length;a>o;o++){var u=n.normalizedDeps[o];-1==g.call(t,u)&&(v[u]?f(u,t):p(u))}n.evaluated||(n.evaluated=!0,n.module.execute.call(e))}}function p(e){if(I[e])return I[e];if("@node/"==e.substr(0,6))return I[e]=s(D(e.substr(6)));var r=v[e];if(!r)throw"Module "+e+" not present.";return a(e),f(e,[]),v[e]=void 0,r.declarative&&x(r.module.exports,"__esModule",{value:!0}),I[e]=r.declarative?r.module.exports:r.esModule}var v={},g=Array.prototype.indexOf||function(e){for(var r=0,t=this.length;t>r;r++)if(this[r]===e)return r;return-1},m=!0;try{Object.getOwnPropertyDescriptor({a:0},"a")}catch(h){m=!1}var x;!function(){try{Object.defineProperty({},"a",{})&&(x=Object.defineProperty)}catch(e){x=function(e,r,t){try{e[r]=t.value||t.get.call(e)}catch(n){}}}}();var y={},D="undefined"!=typeof System&&System._nodeRequire||"undefined"!=typeof require&&"undefined"!=typeof require.resolve&&"undefined"!=typeof process&&process.platform&&require,I={"@empty":{}};return function(e,n,o,a){return function(u){u(function(u){for(var d={_nodeRequire:D,register:r,registerDynamic:t,get:p,set:function(e,r){I[e]=r},newModule:function(e){return e}},i=0;i<n.length;i++)(function(e,r){r&&r.__esModule?I[e]=r:I[e]=s(r)})(n[i],arguments[i]);a(d);var l=p(e[0]);if(e.length>1)for(var i=1;i<e.length;i++)p(e[i]);return o?l["default"]:l})}}}("undefined"!=typeof self?self:global)

(["1"], [], false, function($__System) {
var require = this.require, exports = this.exports, module = this.module;
$__System.register("2", ["3", "4"], function (_export) {
    var _Object$freeze, _Promise, amdLoaderFunction;

    return {
        setters: [function (_) {
            _Object$freeze = _["default"];
        }, function (_2) {
            _Promise = _2["default"];
        }],
        execute: function () {
            "use strict";

            amdLoaderFunction = function amdLoaderFunction(id, resolve, reject) {
                window.require([id], resolve, reject);
            };

            _export("amdLoaderFunction", amdLoaderFunction);

            _export("default", function () {
                var loaderFunction = arguments.length <= 0 || arguments[0] === undefined ? amdLoaderFunction : arguments[0];

                return _Object$freeze({
                    load: function load(id) {
                        return new _Promise(function (resolve, reject) {
                            return loaderFunction(id, resolve, reject);
                        });
                    }
                });
            });
        }
    };
});
$__System.register('5', ['3'], function (_export) {
    var _Object$freeze;

    function Signal() {

        var listenerBoxes = [];

        function registerListener(listener, scope, once) {

            listenerBoxes.filter(function (box) {
                return box.listener === listener && box.scope === scope && function (box) {
                    return box.once && !once || once && !box.once;
                };
            }).forEach(function (_) {
                throw new Error('You cannot addOnce() then try to add() the same listener without removing the relationship first.');
            });
            listenerBoxes = listenerBoxes.concat([{ listener: listener, scope: scope, once: once }]);
        }

        function emit(value) {
            listenerBoxes.forEach(function (_ref) {
                var listener = _ref.listener;
                var scope = _ref.scope;
                var once = _ref.once;

                once && disconnect(listener, scope);
                listener.call(scope, value);
            });
        }

        var connect = function connect(slot, scope) {
            return registerListener(slot, scope, false);
        };

        var connectOnce = function connectOnce(slot, scope) {
            return registerListener(slot, scope, true);
        };

        function disconnect(slot, _scope) {
            listenerBoxes = listenerBoxes.filter(function (_ref2) {
                var listener = _ref2.listener;
                var scope = _ref2.scope;
                return listener !== slot && scope !== _scope;
            });
        }

        function disconnectAll() {
            listenerBoxes.forEach(function (_ref3) {
                var listener = _ref3.listener;
                var scope = _ref3.scope;
                return disconnect(listener, scope);
            });
        }

        return _Object$freeze({
            connect: connect,
            connectOnce: connectOnce,
            disconnect: disconnect,
            disconnectAll: disconnectAll,
            emit: emit

        });
    }

    return {
        setters: [function (_2) {
            _Object$freeze = _2['default'];
        }],
        execute: function () {
            'use strict';

            _export('default', Signal);
        }
    };
});
$__System.registerDynamic('6', ['7'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry2 = $__require('7');
  module.exports = _curry2(function prop(p, obj) {
    return obj[p];
  });
});
$__System.registerDynamic('8', ['7', '9', '6'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry2 = $__require('7');
  var map = $__require('9');
  var prop = $__require('6');
  module.exports = _curry2(function pluck(p, list) {
    return map(prop(p), list);
  });
});
$__System.register("a", ["8", "9", "c", "d", "e", "b"], function (_export) {
    /**
     * Created by marcogobbi on 01/04/2017.
     */
    "use strict";

    var pluck, map, flatten, compose, filter, getAllElements;

    _export("default", makeChain);

    function makeChain(prop, emit) {
        return compose(function (nodes) {
            if (nodes.length > 0) {
                emit(nodes);
            }
        }, filter(function (nodes) {
            return nodes.length > 0;
        }), map(getAllElements), filter(function (node) {
            return node.querySelectorAll;
        }), flatten, pluck(prop) //"addedNodes","removedNodes"
        );
    }

    return {
        setters: [function (_2) {
            pluck = _2["default"];
        }, function (_) {
            map = _["default"];
        }, function (_c) {
            flatten = _c["default"];
        }, function (_d) {
            compose = _d["default"];
        }, function (_e) {
            filter = _e["default"];
        }, function (_b) {
            getAllElements = _b["default"];
        }],
        execute: function () {}
    };
});
$__System.register("f", ["3", "5", "a"], function (_export) {
    var _Object$freeze, Signal, makeChain;

    return {
        setters: [function (_) {
            _Object$freeze = _["default"];
        }, function (_2) {
            Signal = _2["default"];
        }, function (_a) {
            makeChain = _a["default"];
        }],
        execute: function () {
            "use strict";

            _export("default", function () {
                var root = arguments.length <= 0 || arguments[0] === undefined ? document.body : arguments[0];

                var onAdded = Signal();
                var onRemoved = Signal();

                var getAdded = makeChain("addedNodes", onAdded.emit);
                var getRemoved = makeChain("removedNodes", onRemoved.emit);

                var handleMutations = function handleMutations(mutations) {

                    getRemoved(mutations);
                    getAdded(mutations);
                };
                var observer = new MutationObserver(handleMutations);
                /* <h3>Configuration of the observer.</h3>
                 <p>Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.</p>
                 */
                observer.observe(root, {
                    attributes: false, //true
                    childList: true,
                    characterData: false,
                    subtree: true
                });
                function dispose() {
                    observer.disconnect();
                    onAdded.disconnectAll();
                    onRemoved.disconnectAll();
                }

                return _Object$freeze({ onAdded: onAdded, onRemoved: onRemoved, dispose: dispose });
            });
        }
    };
});
$__System.register("10", ["3", "4"], function (_export) {
    var _Object$freeze, _Promise;

    function defaultLoader(id) {
        var getPromise = function getPromise() {
            if (System["import"]) {
                return function (url) {
                    return System["import"](url);
                };
            } else {
                return function (url) {
                    return _Promise.resolve(System.get(url));
                };
            }
        };
        return getPromise()(id).then(function (e) {
            return e["default"] ? e["default"] : e;
        })["catch"](function (e) {
            console.log(e);
        });
    }
    return {
        setters: [function (_2) {
            _Object$freeze = _2["default"];
        }, function (_) {
            _Promise = _["default"];
        }],
        execute: function () {
            "use strict";

            _export("default", function () {
                var loaderFunction = arguments.length <= 0 || arguments[0] === undefined ? defaultLoader : arguments[0];

                return _Object$freeze({
                    load: loaderFunction
                });
            });
        }
    };
});
$__System.registerDynamic('11', ['12', '13', '14'], true, function ($__require, exports, module) {
    var global = this || self,
        GLOBAL = global;
    /* */
    var $export = $__require('12'),
        core = $__require('13'),
        fails = $__require('14');
    module.exports = function (KEY, exec) {
        var fn = (core.Object || {})[KEY] || Object[KEY],
            exp = {};
        exp[KEY] = exec(fn);
        $export($export.S + $export.F * fails(function () {
            fn(1);
        }), 'Object', exp);
    };
});
$__System.registerDynamic('15', ['16', '11'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var isObject = $__require('16');
  $__require('11')('freeze', function ($freeze) {
    return function freeze(it) {
      return $freeze && isObject(it) ? $freeze(it) : it;
    };
  });
});
$__System.registerDynamic('17', ['15', '13'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  $__require('15');
  module.exports = $__require('13').Object.freeze;
});
$__System.registerDynamic("3", ["17"], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = { "default": $__require("17"), __esModule: true };
});
$__System.registerDynamic('18', ['19'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var $ = $__require('19');
  module.exports = function defineProperty(it, key, desc) {
    return $.setDesc(it, key, desc);
  };
});
$__System.registerDynamic("1a", ["18"], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = { "default": $__require("18"), __esModule: true };
});
$__System.registerDynamic("1b", ["1a"], true, function ($__require, exports, module) {
  /* */
  "use strict";

  var global = this || self,
      GLOBAL = global;
  var _Object$defineProperty = $__require("1a")["default"];
  exports["default"] = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        _Object$defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();
  exports.__esModule = true;
});
$__System.registerDynamic("1c", [], true, function ($__require, exports, module) {
  /* */
  "use strict";

  var global = this || self,
      GLOBAL = global;
  exports["default"] = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  exports.__esModule = true;
});
$__System.register("1d", ["1b", "1c"], function (_export) {
    var _createClass, _classCallCheck, RJSEvent;

    return {
        setters: [function (_b) {
            _createClass = _b["default"];
        }, function (_c) {
            _classCallCheck = _c["default"];
        }],
        execute: function () {
            "use strict";

            RJSEvent = (function () {
                function RJSEvent(type) {
                    var data = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
                    var bubbles = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
                    var cancelable = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

                    _classCallCheck(this, RJSEvent);

                    this.data = data;
                    this.type = type;
                    this.bubbles = bubbles;
                    this.cancelable = cancelable;
                    this.timeStamp = new Date().getTime();
                    //
                    this.defaultPrevented = false;
                    this.propagationStopped = false;
                    this.immediatePropagationStopped = false;
                    this.removed = false;
                    this.target;
                    this.currentTarget;
                    this.eventPhase = 0;
                }

                _createClass(RJSEvent, [{
                    key: "preventDefault",
                    value: function preventDefault() {
                        this.defaultPrevented = true;
                    }
                }, {
                    key: "stopPropagation",
                    value: function stopPropagation() {
                        this.propagationStopped = true;
                    }
                }, {
                    key: "stopImmediatePropagation",
                    value: function stopImmediatePropagation() {
                        this.immediatePropagationStopped = this.propagationStopped = true;
                    }
                }, {
                    key: "remove",
                    value: function remove() {
                        this.removed = true;
                    }
                }, {
                    key: "clone",
                    value: function clone() {
                        return new RJSEvent(this.type, this.data, this.bubbles, this.cancelable);
                    }
                }]);

                return RJSEvent;
            })();

            _export("default", RJSEvent);
        }
    };
});
$__System.register("1e", ["1b", "1c", "1d"], function (_export) {
    var _createClass, _classCallCheck, RJSEvent, EventDispatcher, makeDispatcher;

    return {
        setters: [function (_b) {
            _createClass = _b["default"];
        }, function (_c) {
            _classCallCheck = _c["default"];
        }, function (_d) {
            RJSEvent = _d["default"];
        }],
        execute: function () {
            "use strict";

            EventDispatcher = (function () {
                function EventDispatcher() {
                    _classCallCheck(this, EventDispatcher);

                    this._listeners = {};
                }

                _createClass(EventDispatcher, [{
                    key: "addEventListener",
                    value: function addEventListener(type, listener, useCapture) {
                        var listeners;
                        if (useCapture) {
                            listeners = this._captureListeners = this._captureListeners || {};
                        } else {
                            listeners = this._listeners = this._listeners || {};
                        }
                        var arr = listeners[type];
                        if (arr) {
                            this.removeEventListener(type, listener, useCapture);
                        }
                        arr = listeners[type]; // remove may have deleted the array
                        if (!arr) {
                            listeners[type] = [listener];
                        } else {
                            arr.push(listener);
                        }
                        return listener;
                    }
                }, {
                    key: "removeEventListener",
                    value: function removeEventListener(type, listener, useCapture) {
                        var listeners = useCapture ? this._captureListeners : this._listeners;
                        if (!listeners) {
                            return;
                        }
                        var arr = listeners[type];
                        if (!arr) {
                            return;
                        }
                        for (var i = 0, l = arr.length; i < l; i++) {
                            if (arr[i] == listener) {
                                if (l == 1) {
                                    delete listeners[type];
                                } // allows for faster checks.
                                else {
                                        arr.splice(i, 1);
                                    }
                                break;
                            }
                        }
                    }
                }, {
                    key: "removeAllEventListeners",
                    value: function removeAllEventListeners(type) {
                        if (!type) {
                            this._listeners = this._captureListeners = null;
                        } else {
                            if (this._listeners) {
                                delete this._listeners[type];
                            }
                            if (this._captureListeners) {
                                delete this._captureListeners[type];
                            }
                        }
                    }
                }, {
                    key: "dispatchEvent",
                    value: function dispatchEvent(eventObj) {
                        if (typeof eventObj == "string") {
                            // won't bubble, so skip everything if there's no listeners:
                            var listeners = this._listeners;
                            if (!listeners || !listeners[eventObj]) {
                                return false;
                            }
                            eventObj = new RJSEvent(eventObj);
                        } else if (eventObj.target && eventObj.clone) {
                            // redispatching an active event object, so clone it:
                            eventObj = eventObj.clone();
                        }
                        try {
                            eventObj.target = this;
                        } catch (e) {} // try/catch allows redispatching of native events

                        if (!eventObj.bubbles || !this.parent) {
                            this._dispatchEvent(eventObj, 2);
                        } else {
                            var top = this,
                                list = [top];
                            while (top.parent) {
                                list.push(top = top.parent);
                            }
                            var i,
                                l = list.length;

                            // capture & atTarget
                            for (i = l - 1; i >= 0 && !eventObj.propagationStopped; i--) {
                                list[i]._dispatchEvent(eventObj, 1 + (i == 0));
                            }
                            // bubbling
                            for (i = 1; i < l && !eventObj.propagationStopped; i++) {
                                list[i]._dispatchEvent(eventObj, 3);
                            }
                        }
                        return eventObj.defaultPrevented;
                    }
                }, {
                    key: "hasEventListener",
                    value: function hasEventListener(type) {
                        var listeners = this._listeners,
                            captureListeners = this._captureListeners;
                        return !!(listeners && listeners[type] || captureListeners && captureListeners[type]);
                    }
                }, {
                    key: "_dispatchEvent",
                    value: function _dispatchEvent(eventObj, eventPhase) {
                        var l,
                            listeners = eventPhase == 1 ? this._captureListeners : this._listeners;
                        if (eventObj && listeners) {
                            var arr = listeners[eventObj.type];
                            if (!arr || !(l = arr.length)) {
                                return;
                            }
                            try {
                                eventObj.currentTarget = this;
                            } catch (e) {}
                            try {
                                eventObj.eventPhase = eventPhase;
                            } catch (e) {}
                            eventObj.removed = false;
                            arr = arr.slice(); // to avoid issues with items being removed or added during the dispatch
                            for (var i = 0; i < l && !eventObj.immediatePropagationStopped; i++) {
                                var o = arr[i];
                                if (o.handleEvent) {
                                    o.handleEvent(eventObj);
                                } else {
                                    o(eventObj);
                                }
                                if (eventObj.removed) {
                                    this.removeEventListener(eventObj.type, o, eventPhase == 1);
                                    eventObj.removed = false;
                                }
                            }
                        }
                    }
                }]);

                return EventDispatcher;
            })();

            _export("default", new EventDispatcher());

            makeDispatcher = function makeDispatcher() {
                return new EventDispatcher();
            };

            _export("makeDispatcher", makeDispatcher);
        }
    };
});
$__System.register('1f', [], function (_export) {
    /**
     * Created by mgobbi on 31/03/2017.
     */
    'use strict';

    var REG_EXP, STRING;
    return {
        setters: [],
        execute: function () {
            REG_EXP = /[xy]/g;
            STRING = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

            _export('default', function () {
                return STRING.replace(REG_EXP, function (c) {
                    var r = Math.random() * 16 | 0;
                    var v = c === 'x' ? r : r & 0x3 | 0x8;
                    return v.toString(16);
                });
            });
        }
    };
});
$__System.register("20", ["21", "1f"], function (_export) {
    /**
     * Created by mgobbi on 31/03/2017.
     */
    "use strict";

    var curryN, nextUid, noop;

    function create(node, dispatcher, Mediator) {
        var mediatorId = nextUid();
        node.setAttribute('mediatorid', mediatorId);
        var dispose = Mediator(node, dispatcher) || noop;
        return {
            mediatorId: mediatorId,
            node: node,
            dispose: dispose
        };
    }
    return {
        setters: [function (_2) {
            curryN = _2["default"];
        }, function (_f) {
            nextUid = _f["default"];
        }],
        execute: function () {
            noop = function noop(_) {
                return _;
            };

            _export("default", curryN(3, create));
        }
    };
});
$__System.registerDynamic('22', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function _reduced(x) {
    return x && x['@@transducer/reduced'] ? x : {
      '@@transducer/value': x,
      '@@transducer/reduced': true
    };
  };
});
$__System.registerDynamic('23', ['7', '22', '24'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry2 = $__require('7');
  var _reduced = $__require('22');
  var _xfBase = $__require('24');
  module.exports = function () {
    function XFind(f, xf) {
      this.xf = xf;
      this.f = f;
      this.found = false;
    }
    XFind.prototype['@@transducer/init'] = _xfBase.init;
    XFind.prototype['@@transducer/result'] = function (result) {
      if (!this.found) {
        result = this.xf['@@transducer/step'](result, void 0);
      }
      return this.xf['@@transducer/result'](result);
    };
    XFind.prototype['@@transducer/step'] = function (result, input) {
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
});
$__System.registerDynamic('25', ['7', '26', '23'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry2 = $__require('7');
  var _dispatchable = $__require('26');
  var _xfind = $__require('23');
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
});
$__System.register("27", ["25"], function (_export) {
  /**
   * Created by mgobbi on 31/03/2017.
   */
  "use strict";

  var find;
  return {
    setters: [function (_) {
      find = _["default"];
    }],
    execute: function () {
      _export("default", function (MEDIATORS_CACHE, node) {
        return !!find(function (disposable) {
          return disposable.node === node;
        }, MEDIATORS_CACHE);
      });
    }
  };
});
$__System.register("28", ["21"], function (_export) {
    /**
     * Created by marcogobbi on 02/04/2017.
     */
    "use strict";

    var curryN;
    return {
        setters: [function (_) {
            curryN = _["default"];
        }],
        execute: function () {
            _export("default", function (getDefinition, create, updateCache) {
                return curryN(3, function (dispatcher, load, node) {
                    return load(getDefinition(node)).then(create(node, dispatcher)).then(updateCache);
                });
            });
        }
    };
});
$__System.register("29", ["3", "20", "21", "27", "28", "1e", "b"], function (_export) {
    var _Object$freeze, create, curryN, inCache, FindMediator, makeDispatcher, getAllElements, GetDefinition;

    return {
        setters: [function (_) {
            _Object$freeze = _["default"];
        }, function (_2) {
            create = _2["default"];
        }, function (_5) {
            curryN = _5["default"];
        }, function (_3) {
            inCache = _3["default"];
        }, function (_4) {
            FindMediator = _4["default"];
        }, function (_e) {
            makeDispatcher = _e.makeDispatcher;
        }, function (_b) {
            getAllElements = _b["default"];
        }],
        execute: function () {
            /**
             * Created by marco.gobbi on 21/01/2015.
             */

            "use strict";

            GetDefinition = curryN(2, function (definitions, node) {
                return definitions[node.getAttribute("data-mediator")];
            });

            _export("default", function (params) {
                //crea un'istanza dell'EventDispatcher se non viene passata
                var _params$definitions = params.definitions;
                var definitions = _params$definitions === undefined ? {} : _params$definitions;
                var _params$dispatcher = params.dispatcher;
                var dispatcher = _params$dispatcher === undefined ? makeDispatcher() : _params$dispatcher;

                //inizializza la cache dei mediatori registrati
                var MEDIATORS_CACHE = [];
                var getDefinition = GetDefinition(definitions);

                function destroy(node) {
                    for (var i = 0; i < MEDIATORS_CACHE.length; i++) {
                        var disposable = MEDIATORS_CACHE[i];
                        if (disposable && disposable.node === node) {
                            disposable.dispose();
                            disposable.node = null;
                            MEDIATORS_CACHE[i] = null;
                        }
                    }

                    MEDIATORS_CACHE = MEDIATORS_CACHE.filter(function (m) {
                        return m;
                    });
                    return MEDIATORS_CACHE;
                }

                function dispose() {
                    MEDIATORS_CACHE.forEach(function (disposable) {
                        if (disposable) {
                            disposable.dispose();
                            disposable.node = null;
                        }
                    });
                    MEDIATORS_CACHE = [];
                    dispatcher.removeAllEventListeners();
                }

                function updateCache(disposable) {
                    MEDIATORS_CACHE.push(disposable); //[mediatorId] = disposeFunction;
                    return MEDIATORS_CACHE;
                }

                var _findMediator = FindMediator(getDefinition, create, updateCache);
                // var findMediators = curryN(2, function (load, node) {
                //     return load(getDefinition(node))
                //         .then(create(node, dispatcher))
                //         .then(updateCache);
                // });

                function hasMediator(node) {
                    return !!getDefinition(node) && !inCache(MEDIATORS_CACHE, node);
                }

                return _Object$freeze({
                    dispose: dispose,
                    destroy: destroy,
                    findMediator: _findMediator(dispatcher),
                    hasMediator: hasMediator,
                    getAllElements: getAllElements

                });
            });

            ;
        }
    };
});
$__System.registerDynamic("2a", [], true, function ($__require, exports, module) {
  /* */
  "format cjs";

  var global = this || self,
      GLOBAL = global;
});
$__System.registerDynamic('2b', ['2c', '2d'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var toInteger = $__require('2c'),
      defined = $__require('2d');
  module.exports = function (TO_STRING) {
    return function (that, pos) {
      var s = String(defined(that)),
          i = toInteger(pos),
          l = s.length,
          a,
          b;
      if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
      a = s.charCodeAt(i);
      return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff ? TO_STRING ? s.charAt(i) : a : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
    };
  };
});
$__System.registerDynamic('2e', ['2b', '2f'], true, function ($__require, exports, module) {
  /* */
  'use strict';

  var global = this || self,
      GLOBAL = global;
  var $at = $__require('2b')(true);
  $__require('2f')(String, 'String', function (iterated) {
    this._t = String(iterated);
    this._i = 0;
  }, function () {
    var O = this._t,
        index = this._i,
        point;
    if (index >= O.length) return {
      value: undefined,
      done: true
    };
    point = $at(O, index);
    this._i += point.length;
    return {
      value: point,
      done: false
    };
  });
});
$__System.registerDynamic("30", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function () {/* empty */};
});
$__System.registerDynamic("31", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function (done, value) {
    return { value: value, done: !!done };
  };
});
$__System.registerDynamic('32', ['33'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var cof = $__require('33');
  module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
    return cof(it) == 'String' ? it.split('') : Object(it);
  };
});
$__System.registerDynamic("2d", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  // 7.2.1 RequireObjectCoercible(argument)
  module.exports = function (it) {
    if (it == undefined) throw TypeError("Can't call method on  " + it);
    return it;
  };
});
$__System.registerDynamic('34', ['32', '2d'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var IObject = $__require('32'),
      defined = $__require('2d');
  module.exports = function (it) {
    return IObject(defined(it));
  };
});
$__System.registerDynamic('35', ['19', '36', '37', '38', '39'], true, function ($__require, exports, module) {
  /* */
  'use strict';

  var global = this || self,
      GLOBAL = global;
  var $ = $__require('19'),
      descriptor = $__require('36'),
      setToStringTag = $__require('37'),
      IteratorPrototype = {};
  $__require('38')(IteratorPrototype, $__require('39')('iterator'), function () {
    return this;
  });
  module.exports = function (Constructor, NAME, next) {
    Constructor.prototype = $.create(IteratorPrototype, { next: descriptor(1, next) });
    setToStringTag(Constructor, NAME + ' Iterator');
  };
});
$__System.registerDynamic('2f', ['3a', '12', '3b', '38', '3c', '3d', '35', '37', '19', '39'], true, function ($__require, exports, module) {
  /* */
  'use strict';

  var global = this || self,
      GLOBAL = global;
  var LIBRARY = $__require('3a'),
      $export = $__require('12'),
      redefine = $__require('3b'),
      hide = $__require('38'),
      has = $__require('3c'),
      Iterators = $__require('3d'),
      $iterCreate = $__require('35'),
      setToStringTag = $__require('37'),
      getProto = $__require('19').getProto,
      ITERATOR = $__require('39')('iterator'),
      BUGGY = !([].keys && 'next' in [].keys()),
      FF_ITERATOR = '@@iterator',
      KEYS = 'keys',
      VALUES = 'values';
  var returnThis = function () {
    return this;
  };
  module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
    $iterCreate(Constructor, NAME, next);
    var getMethod = function (kind) {
      if (!BUGGY && kind in proto) return proto[kind];
      switch (kind) {
        case KEYS:
          return function keys() {
            return new Constructor(this, kind);
          };
        case VALUES:
          return function values() {
            return new Constructor(this, kind);
          };
      }
      return function entries() {
        return new Constructor(this, kind);
      };
    };
    var TAG = NAME + ' Iterator',
        DEF_VALUES = DEFAULT == VALUES,
        VALUES_BUG = false,
        proto = Base.prototype,
        $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT],
        $default = $native || getMethod(DEFAULT),
        methods,
        key;
    if ($native) {
      var IteratorPrototype = getProto($default.call(new Base()));
      setToStringTag(IteratorPrototype, TAG, true);
      if (!LIBRARY && has(proto, FF_ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);
      if (DEF_VALUES && $native.name !== VALUES) {
        VALUES_BUG = true;
        $default = function values() {
          return $native.call(this);
        };
      }
    }
    if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
      hide(proto, ITERATOR, $default);
    }
    Iterators[NAME] = $default;
    Iterators[TAG] = returnThis;
    if (DEFAULT) {
      methods = {
        values: DEF_VALUES ? $default : getMethod(VALUES),
        keys: IS_SET ? $default : getMethod(KEYS),
        entries: !DEF_VALUES ? $default : getMethod('entries')
      };
      if (FORCED) for (key in methods) {
        if (!(key in proto)) redefine(proto, key, methods[key]);
      } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
    }
    return methods;
  };
});
$__System.registerDynamic('3e', ['30', '31', '3d', '34', '2f'], true, function ($__require, exports, module) {
  /* */
  'use strict';

  var global = this || self,
      GLOBAL = global;
  var addToUnscopables = $__require('30'),
      step = $__require('31'),
      Iterators = $__require('3d'),
      toIObject = $__require('34');
  module.exports = $__require('2f')(Array, 'Array', function (iterated, kind) {
    this._t = toIObject(iterated);
    this._i = 0;
    this._k = kind;
  }, function () {
    var O = this._t,
        kind = this._k,
        index = this._i++;
    if (!O || index >= O.length) {
      this._t = undefined;
      return step(1);
    }
    if (kind == 'keys') return step(0, index);
    if (kind == 'values') return step(0, O[index]);
    return step(0, [index, O[index]]);
  }, 'values');
  Iterators.Arguments = Iterators.Array;
  addToUnscopables('keys');
  addToUnscopables('values');
  addToUnscopables('entries');
});
$__System.registerDynamic('3f', ['3e', '3d'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  $__require('3e');
  var Iterators = $__require('3d');
  Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
});
$__System.registerDynamic("3a", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = true;
});
$__System.registerDynamic('12', ['40', '13', '41'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var global = $__require('40'),
      core = $__require('13'),
      ctx = $__require('41'),
      PROTOTYPE = 'prototype';
  var $export = function (type, name, source) {
    var IS_FORCED = type & $export.F,
        IS_GLOBAL = type & $export.G,
        IS_STATIC = type & $export.S,
        IS_PROTO = type & $export.P,
        IS_BIND = type & $export.B,
        IS_WRAP = type & $export.W,
        exports = IS_GLOBAL ? core : core[name] || (core[name] = {}),
        target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE],
        key,
        own,
        out;
    if (IS_GLOBAL) source = name;
    for (key in source) {
      own = !IS_FORCED && target && key in target;
      if (own && key in exports) continue;
      out = own ? target[key] : source[key];
      exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key] : IS_BIND && own ? ctx(out, global) : IS_WRAP && target[key] == out ? function (C) {
        var F = function (param) {
          return this instanceof C ? new C(param) : C(param);
        };
        F[PROTOTYPE] = C[PROTOTYPE];
        return F;
      }(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
      if (IS_PROTO) (exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
    }
  };
  $export.F = 1;
  $export.G = 2;
  $export.S = 4;
  $export.P = 8;
  $export.B = 16;
  $export.W = 32;
  module.exports = $export;
});
$__System.registerDynamic("42", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function (it, Constructor, name) {
    if (!(it instanceof Constructor)) throw TypeError(name + ": use the 'new' operator!");
    return it;
  };
});
$__System.registerDynamic('43', ['44'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var anObject = $__require('44');
  module.exports = function (iterator, fn, value, entries) {
    try {
      return entries ? fn(anObject(value)[0], value[1]) : fn(value);
    } catch (e) {
      var ret = iterator['return'];
      if (ret !== undefined) anObject(ret.call(iterator));
      throw e;
    }
  };
});
$__System.registerDynamic('45', ['3d', '39'], true, function ($__require, exports, module) {
    var global = this || self,
        GLOBAL = global;
    /* */
    var Iterators = $__require('3d'),
        ITERATOR = $__require('39')('iterator'),
        ArrayProto = Array.prototype;
    module.exports = function (it) {
        return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
    };
});
$__System.registerDynamic("2c", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  // 7.1.4 ToInteger
  var ceil = Math.ceil,
      floor = Math.floor;
  module.exports = function (it) {
    return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
  };
});
$__System.registerDynamic('46', ['2c'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var toInteger = $__require('2c'),
      min = Math.min;
  module.exports = function (it) {
    return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0;
  };
});
$__System.registerDynamic('47', ['33', '39'], true, function ($__require, exports, module) {
    var global = this || self,
        GLOBAL = global;
    /* */
    var cof = $__require('33'),
        TAG = $__require('39')('toStringTag'),
        ARG = cof(function () {
        return arguments;
    }()) == 'Arguments';
    module.exports = function (it) {
        var O, T, B;
        return it === undefined ? 'Undefined' : it === null ? 'Null' : typeof (T = (O = Object(it))[TAG]) == 'string' ? T : ARG ? cof(O) : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
    };
});
$__System.registerDynamic("3d", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = {};
});
$__System.registerDynamic('48', ['47', '39', '3d', '13'], true, function ($__require, exports, module) {
    var global = this || self,
        GLOBAL = global;
    /* */
    var classof = $__require('47'),
        ITERATOR = $__require('39')('iterator'),
        Iterators = $__require('3d');
    module.exports = $__require('13').getIteratorMethod = function (it) {
        if (it != undefined) return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
    };
});
$__System.registerDynamic('49', ['41', '43', '45', '44', '46', '48'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var ctx = $__require('41'),
      call = $__require('43'),
      isArrayIter = $__require('45'),
      anObject = $__require('44'),
      toLength = $__require('46'),
      getIterFn = $__require('48');
  module.exports = function (iterable, entries, fn, that) {
    var iterFn = getIterFn(iterable),
        f = ctx(fn, that, entries ? 2 : 1),
        index = 0,
        length,
        step,
        iterator;
    if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
    if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
      entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
      call(iterator, f, step.value, entries);
    }
  };
});
$__System.registerDynamic('4a', ['19', '16', '44', '41'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var getDesc = $__require('19').getDesc,
      isObject = $__require('16'),
      anObject = $__require('44');
  var check = function (O, proto) {
    anObject(O);
    if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
  };
  module.exports = {
    set: Object.setPrototypeOf || ('__proto__' in {} ? function (test, buggy, set) {
      try {
        set = $__require('41')(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) {
        buggy = true;
      }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
    check: check
  };
});
$__System.registerDynamic("4b", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  // 7.2.9 SameValue(x, y)
  module.exports = Object.is || function is(x, y) {
    return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
  };
});
$__System.registerDynamic('44', ['16'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var isObject = $__require('16');
  module.exports = function (it) {
    if (!isObject(it)) throw TypeError(it + ' is not an object!');
    return it;
  };
});
$__System.registerDynamic('4c', ['44', '4d', '39'], true, function ($__require, exports, module) {
    var global = this || self,
        GLOBAL = global;
    /* */
    var anObject = $__require('44'),
        aFunction = $__require('4d'),
        SPECIES = $__require('39')('species');
    module.exports = function (O, D) {
        var C = anObject(O).constructor,
            S;
        return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
    };
});
$__System.registerDynamic('4d', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function (it) {
    if (typeof it != 'function') throw TypeError(it + ' is not a function!');
    return it;
  };
});
$__System.registerDynamic('41', ['4d'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var aFunction = $__require('4d');
  module.exports = function (fn, that, length) {
    aFunction(fn);
    if (that === undefined) return fn;
    switch (length) {
      case 1:
        return function (a) {
          return fn.call(that, a);
        };
      case 2:
        return function (a, b) {
          return fn.call(that, a, b);
        };
      case 3:
        return function (a, b, c) {
          return fn.call(that, a, b, c);
        };
    }
    return function () {
      return fn.apply(that, arguments);
    };
  };
});
$__System.registerDynamic("4e", [], true, function ($__require, exports, module) {
                  var global = this || self,
                      GLOBAL = global;
                  // fast apply, http://jsperf.lnkit.com/fast-apply/5
                  module.exports = function (fn, args, that) {
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
                                    }return fn.apply(that, args);
                  };
});
$__System.registerDynamic('4f', ['40'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = $__require('40').document && document.documentElement;
});
$__System.registerDynamic('16', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function (it) {
    return typeof it === 'object' ? it !== null : typeof it === 'function';
  };
});
$__System.registerDynamic('50', ['16', '40'], true, function ($__require, exports, module) {
    var global = this || self,
        GLOBAL = global;
    /* */
    var isObject = $__require('16'),
        document = $__require('40').document,
        is = isObject(document) && isObject(document.createElement);
    module.exports = function (it) {
        return is ? document.createElement(it) : {};
    };
});
$__System.registerDynamic('51', ['41', '4e', '4f', '50', '40', '33', '52'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  (function (process) {
    var ctx = $__require('41'),
        invoke = $__require('4e'),
        html = $__require('4f'),
        cel = $__require('50'),
        global = $__require('40'),
        process = global.process,
        setTask = global.setImmediate,
        clearTask = global.clearImmediate,
        MessageChannel = global.MessageChannel,
        counter = 0,
        queue = {},
        ONREADYSTATECHANGE = 'onreadystatechange',
        defer,
        channel,
        port;
    var run = function () {
      var id = +this;
      if (queue.hasOwnProperty(id)) {
        var fn = queue[id];
        delete queue[id];
        fn();
      }
    };
    var listner = function (event) {
      run.call(event.data);
    };
    if (!setTask || !clearTask) {
      setTask = function setImmediate(fn) {
        var args = [],
            i = 1;
        while (arguments.length > i) args.push(arguments[i++]);
        queue[++counter] = function () {
          invoke(typeof fn == 'function' ? fn : Function(fn), args);
        };
        defer(counter);
        return counter;
      };
      clearTask = function clearImmediate(id) {
        delete queue[id];
      };
      if ($__require('33')(process) == 'process') {
        defer = function (id) {
          process.nextTick(ctx(run, id, 1));
        };
      } else if (MessageChannel) {
        channel = new MessageChannel();
        port = channel.port2;
        channel.port1.onmessage = listner;
        defer = ctx(port.postMessage, port, 1);
      } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
        defer = function (id) {
          global.postMessage(id + '', '*');
        };
        global.addEventListener('message', listner, false);
      } else if (ONREADYSTATECHANGE in cel('script')) {
        defer = function (id) {
          html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {
            html.removeChild(this);
            run.call(id);
          };
        };
      } else {
        defer = function (id) {
          setTimeout(ctx(run, id, 1), 0);
        };
      }
    }
    module.exports = {
      set: setTask,
      clear: clearTask
    };
  })($__require('52'));
});
$__System.registerDynamic("33", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var toString = {}.toString;

  module.exports = function (it) {
    return toString.call(it).slice(8, -1);
  };
});
$__System.registerDynamic('53', ['40', '51', '33', '52'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  (function (process) {
    var global = $__require('40'),
        macrotask = $__require('51').set,
        Observer = global.MutationObserver || global.WebKitMutationObserver,
        process = global.process,
        Promise = global.Promise,
        isNode = $__require('33')(process) == 'process',
        head,
        last,
        notify;
    var flush = function () {
      var parent, domain, fn;
      if (isNode && (parent = process.domain)) {
        process.domain = null;
        parent.exit();
      }
      while (head) {
        domain = head.domain;
        fn = head.fn;
        if (domain) domain.enter();
        fn();
        if (domain) domain.exit();
        head = head.next;
      }
      last = undefined;
      if (parent) parent.enter();
    };
    if (isNode) {
      notify = function () {
        process.nextTick(flush);
      };
    } else if (Observer) {
      var toggle = 1,
          node = document.createTextNode('');
      new Observer(flush).observe(node, { characterData: true });
      notify = function () {
        node.data = toggle = -toggle;
      };
    } else if (Promise && Promise.resolve) {
      notify = function () {
        Promise.resolve().then(flush);
      };
    } else {
      notify = function () {
        macrotask.call(global, flush);
      };
    }
    module.exports = function asap(fn) {
      var task = {
        fn: fn,
        next: undefined,
        domain: isNode && process.domain
      };
      if (last) last.next = task;
      if (!head) {
        head = task;
        notify();
      }
      last = task;
    };
  })($__require('52'));
});
$__System.registerDynamic("36", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function (bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };
});
$__System.registerDynamic('38', ['19', '36', '54'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var $ = $__require('19'),
      createDesc = $__require('36');
  module.exports = $__require('54') ? function (object, key, value) {
    return $.setDesc(object, key, createDesc(1, value));
  } : function (object, key, value) {
    object[key] = value;
    return object;
  };
});
$__System.registerDynamic('3b', ['38'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = $__require('38');
});
$__System.registerDynamic('55', ['3b'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var redefine = $__require('3b');
  module.exports = function (target, src) {
    for (var key in src) redefine(target, key, src[key]);
    return target;
  };
});
$__System.registerDynamic("3c", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var hasOwnProperty = {}.hasOwnProperty;
  module.exports = function (it, key) {
    return hasOwnProperty.call(it, key);
  };
});
$__System.registerDynamic('37', ['19', '3c', '39'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var def = $__require('19').setDesc,
      has = $__require('3c'),
      TAG = $__require('39')('toStringTag');
  module.exports = function (it, tag, stat) {
    if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, {
      configurable: true,
      value: tag
    });
  };
});
$__System.registerDynamic("19", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var $Object = Object;
  module.exports = {
    create: $Object.create,
    getProto: $Object.getPrototypeOf,
    isEnum: {}.propertyIsEnumerable,
    getDesc: $Object.getOwnPropertyDescriptor,
    setDesc: $Object.defineProperty,
    setDescs: $Object.defineProperties,
    getKeys: $Object.keys,
    getNames: $Object.getOwnPropertyNames,
    getSymbols: $Object.getOwnPropertySymbols,
    each: [].forEach
  };
});
$__System.registerDynamic("14", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function (exec) {
    try {
      return !!exec();
    } catch (e) {
      return true;
    }
  };
});
$__System.registerDynamic('54', ['14'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = !$__require('14')(function () {
    return Object.defineProperty({}, 'a', { get: function () {
        return 7;
      } }).a != 7;
  });
});
$__System.registerDynamic('56', ['13', '19', '54', '39'], true, function ($__require, exports, module) {
  /* */
  'use strict';

  var global = this || self,
      GLOBAL = global;
  var core = $__require('13'),
      $ = $__require('19'),
      DESCRIPTORS = $__require('54'),
      SPECIES = $__require('39')('species');
  module.exports = function (KEY) {
    var C = core[KEY];
    if (DESCRIPTORS && C && !C[SPECIES]) $.setDesc(C, SPECIES, {
      configurable: true,
      get: function () {
        return this;
      }
    });
  };
});
$__System.registerDynamic('57', ['40'], true, function ($__require, exports, module) {
    var global = this || self,
        GLOBAL = global;
    /* */
    var global = $__require('40'),
        SHARED = '__core-js_shared__',
        store = global[SHARED] || (global[SHARED] = {});
    module.exports = function (key) {
        return store[key] || (store[key] = {});
    };
});
$__System.registerDynamic('58', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var id = 0,
      px = Math.random();
  module.exports = function (key) {
    return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
  };
});
$__System.registerDynamic('40', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
  var global = module.exports = typeof window != 'undefined' && window.Math == Math ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
  if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
});
$__System.registerDynamic('39', ['57', '58', '40'], true, function ($__require, exports, module) {
    var global = this || self,
        GLOBAL = global;
    /* */
    var store = $__require('57')('wks'),
        uid = $__require('58'),
        Symbol = $__require('40').Symbol;
    module.exports = function (name) {
        return store[name] || (store[name] = Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
    };
});
$__System.registerDynamic('59', ['39'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var ITERATOR = $__require('39')('iterator'),
      SAFE_CLOSING = false;
  try {
    var riter = [7][ITERATOR]();
    riter['return'] = function () {
      SAFE_CLOSING = true;
    };
    Array.from(riter, function () {
      throw 2;
    });
  } catch (e) {}
  module.exports = function (exec, skipClosing) {
    if (!skipClosing && !SAFE_CLOSING) return false;
    var safe = false;
    try {
      var arr = [7],
          iter = arr[ITERATOR]();
      iter.next = function () {
        return { done: safe = true };
      };
      arr[ITERATOR] = function () {
        return iter;
      };
      exec(arr);
    } catch (e) {}
    return safe;
  };
});
$__System.registerDynamic('5a', [], true, function ($__require, exports, module) {
    var global = this || self,
        GLOBAL = global;
    // shim for using process in browser
    var process = module.exports = {};

    // cached from whatever global is present so that test runners that stub it
    // don't break things.  But we need to wrap it in a try catch in case it is
    // wrapped in strict mode code which doesn't define any globals.  It's inside a
    // function because try/catches deoptimize in certain engines.

    var cachedSetTimeout;
    var cachedClearTimeout;

    function defaultSetTimout() {
        throw new Error('setTimeout has not been defined');
    }
    function defaultClearTimeout() {
        throw new Error('clearTimeout has not been defined');
    }
    (function () {
        try {
            if (typeof setTimeout === 'function') {
                cachedSetTimeout = setTimeout;
            } else {
                cachedSetTimeout = defaultSetTimout;
            }
        } catch (e) {
            cachedSetTimeout = defaultSetTimout;
        }
        try {
            if (typeof clearTimeout === 'function') {
                cachedClearTimeout = clearTimeout;
            } else {
                cachedClearTimeout = defaultClearTimeout;
            }
        } catch (e) {
            cachedClearTimeout = defaultClearTimeout;
        }
    })();
    function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
            //normal enviroments in sane situations
            return setTimeout(fun, 0);
        }
        // if setTimeout wasn't available but was latter defined
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedSetTimeout(fun, 0);
        } catch (e) {
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                return cachedSetTimeout.call(null, fun, 0);
            } catch (e) {
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                return cachedSetTimeout.call(this, fun, 0);
            }
        }
    }
    function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
            //normal enviroments in sane situations
            return clearTimeout(marker);
        }
        // if clearTimeout wasn't available but was latter defined
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedClearTimeout(marker);
        } catch (e) {
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                return cachedClearTimeout.call(null, marker);
            } catch (e) {
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                return cachedClearTimeout.call(this, marker);
            }
        }
    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;

    function cleanUpNextTick() {
        if (!draining || !currentQueue) {
            return;
        }
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = -1;
        }
        if (queue.length) {
            drainQueue();
        }
    }

    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;

        var len = queue.length;
        while (len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = -1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
    }

    process.nextTick = function (fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
        }
    };

    // v8 likes predictible objects
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function () {
        this.fun.apply(null, this.array);
    };
    process.title = 'browser';
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = ''; // empty string to avoid regexp issues
    process.versions = {};

    function noop() {}

    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;

    process.binding = function (name) {
        throw new Error('process.binding is not supported');
    };

    process.cwd = function () {
        return '/';
    };
    process.chdir = function (dir) {
        throw new Error('process.chdir is not supported');
    };
    process.umask = function () {
        return 0;
    };
});
$__System.registerDynamic("5b", ["5a"], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  module.exports = $__require("5a");
});
$__System.registerDynamic('5c', ['5b'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  module.exports = $__System._nodeRequire ? process : $__require('5b');
});
$__System.registerDynamic("52", ["5c"], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  module.exports = $__require("5c");
});
$__System.registerDynamic('5d', ['19', '3a', '40', '41', '47', '12', '16', '44', '4d', '42', '49', '4a', '4b', '39', '4c', '53', '54', '55', '37', '56', '13', '59', '52'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  (function (process) {
    'use strict';

    var $ = $__require('19'),
        LIBRARY = $__require('3a'),
        global = $__require('40'),
        ctx = $__require('41'),
        classof = $__require('47'),
        $export = $__require('12'),
        isObject = $__require('16'),
        anObject = $__require('44'),
        aFunction = $__require('4d'),
        strictNew = $__require('42'),
        forOf = $__require('49'),
        setProto = $__require('4a').set,
        same = $__require('4b'),
        SPECIES = $__require('39')('species'),
        speciesConstructor = $__require('4c'),
        asap = $__require('53'),
        PROMISE = 'Promise',
        process = global.process,
        isNode = classof(process) == 'process',
        P = global[PROMISE],
        empty = function () {},
        Wrapper;
    var testResolve = function (sub) {
      var test = new P(empty),
          promise;
      if (sub) test.constructor = function (exec) {
        exec(empty, empty);
      };
      (promise = P.resolve(test))['catch'](empty);
      return promise === test;
    };
    var USE_NATIVE = function () {
      var works = false;
      function P2(x) {
        var self = new P(x);
        setProto(self, P2.prototype);
        return self;
      }
      try {
        works = P && P.resolve && testResolve();
        setProto(P2, P);
        P2.prototype = $.create(P.prototype, { constructor: { value: P2 } });
        if (!(P2.resolve(5).then(function () {}) instanceof P2)) {
          works = false;
        }
        if (works && $__require('54')) {
          var thenableThenGotten = false;
          P.resolve($.setDesc({}, 'then', { get: function () {
              thenableThenGotten = true;
            } }));
          works = thenableThenGotten;
        }
      } catch (e) {
        works = false;
      }
      return works;
    }();
    var sameConstructor = function (a, b) {
      if (LIBRARY && a === P && b === Wrapper) return true;
      return same(a, b);
    };
    var getConstructor = function (C) {
      var S = anObject(C)[SPECIES];
      return S != undefined ? S : C;
    };
    var isThenable = function (it) {
      var then;
      return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
    };
    var PromiseCapability = function (C) {
      var resolve, reject;
      this.promise = new C(function ($$resolve, $$reject) {
        if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
        resolve = $$resolve;
        reject = $$reject;
      });
      this.resolve = aFunction(resolve), this.reject = aFunction(reject);
    };
    var perform = function (exec) {
      try {
        exec();
      } catch (e) {
        return { error: e };
      }
    };
    var notify = function (record, isReject) {
      if (record.n) return;
      record.n = true;
      var chain = record.c;
      asap(function () {
        var value = record.v,
            ok = record.s == 1,
            i = 0;
        var run = function (reaction) {
          var handler = ok ? reaction.ok : reaction.fail,
              resolve = reaction.resolve,
              reject = reaction.reject,
              result,
              then;
          try {
            if (handler) {
              if (!ok) record.h = true;
              result = handler === true ? value : handler(value);
              if (result === reaction.promise) {
                reject(TypeError('Promise-chain cycle'));
              } else if (then = isThenable(result)) {
                then.call(result, resolve, reject);
              } else resolve(result);
            } else reject(value);
          } catch (e) {
            reject(e);
          }
        };
        while (chain.length > i) run(chain[i++]);
        chain.length = 0;
        record.n = false;
        if (isReject) setTimeout(function () {
          var promise = record.p,
              handler,
              console;
          if (isUnhandled(promise)) {
            if (isNode) {
              process.emit('unhandledRejection', value, promise);
            } else if (handler = global.onunhandledrejection) {
              handler({
                promise: promise,
                reason: value
              });
            } else if ((console = global.console) && console.error) {
              console.error('Unhandled promise rejection', value);
            }
          }
          record.a = undefined;
        }, 1);
      });
    };
    var isUnhandled = function (promise) {
      var record = promise._d,
          chain = record.a || record.c,
          i = 0,
          reaction;
      if (record.h) return false;
      while (chain.length > i) {
        reaction = chain[i++];
        if (reaction.fail || !isUnhandled(reaction.promise)) return false;
      }
      return true;
    };
    var $reject = function (value) {
      var record = this;
      if (record.d) return;
      record.d = true;
      record = record.r || record;
      record.v = value;
      record.s = 2;
      record.a = record.c.slice();
      notify(record, true);
    };
    var $resolve = function (value) {
      var record = this,
          then;
      if (record.d) return;
      record.d = true;
      record = record.r || record;
      try {
        if (record.p === value) throw TypeError("Promise can't be resolved itself");
        if (then = isThenable(value)) {
          asap(function () {
            var wrapper = {
              r: record,
              d: false
            };
            try {
              then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
            } catch (e) {
              $reject.call(wrapper, e);
            }
          });
        } else {
          record.v = value;
          record.s = 1;
          notify(record, false);
        }
      } catch (e) {
        $reject.call({
          r: record,
          d: false
        }, e);
      }
    };
    if (!USE_NATIVE) {
      P = function Promise(executor) {
        aFunction(executor);
        var record = this._d = {
          p: strictNew(this, P, PROMISE),
          c: [],
          a: undefined,
          s: 0,
          d: false,
          v: undefined,
          h: false,
          n: false
        };
        try {
          executor(ctx($resolve, record, 1), ctx($reject, record, 1));
        } catch (err) {
          $reject.call(record, err);
        }
      };
      $__require('55')(P.prototype, {
        then: function then(onFulfilled, onRejected) {
          var reaction = new PromiseCapability(speciesConstructor(this, P)),
              promise = reaction.promise,
              record = this._d;
          reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
          reaction.fail = typeof onRejected == 'function' && onRejected;
          record.c.push(reaction);
          if (record.a) record.a.push(reaction);
          if (record.s) notify(record, false);
          return promise;
        },
        'catch': function (onRejected) {
          return this.then(undefined, onRejected);
        }
      });
    }
    $export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: P });
    $__require('37')(P, PROMISE);
    $__require('56')(PROMISE);
    Wrapper = $__require('13')[PROMISE];
    $export($export.S + $export.F * !USE_NATIVE, PROMISE, { reject: function reject(r) {
        var capability = new PromiseCapability(this),
            $$reject = capability.reject;
        $$reject(r);
        return capability.promise;
      } });
    $export($export.S + $export.F * (!USE_NATIVE || testResolve(true)), PROMISE, { resolve: function resolve(x) {
        if (x instanceof P && sameConstructor(x.constructor, this)) return x;
        var capability = new PromiseCapability(this),
            $$resolve = capability.resolve;
        $$resolve(x);
        return capability.promise;
      } });
    $export($export.S + $export.F * !(USE_NATIVE && $__require('59')(function (iter) {
      P.all(iter)['catch'](function () {});
    })), PROMISE, {
      all: function all(iterable) {
        var C = getConstructor(this),
            capability = new PromiseCapability(C),
            resolve = capability.resolve,
            reject = capability.reject,
            values = [];
        var abrupt = perform(function () {
          forOf(iterable, false, values.push, values);
          var remaining = values.length,
              results = Array(remaining);
          if (remaining) $.each.call(values, function (promise, index) {
            var alreadyCalled = false;
            C.resolve(promise).then(function (value) {
              if (alreadyCalled) return;
              alreadyCalled = true;
              results[index] = value;
              --remaining || resolve(results);
            }, reject);
          });else resolve(results);
        });
        if (abrupt) reject(abrupt.error);
        return capability.promise;
      },
      race: function race(iterable) {
        var C = getConstructor(this),
            capability = new PromiseCapability(C),
            reject = capability.reject;
        var abrupt = perform(function () {
          forOf(iterable, false, function (promise) {
            C.resolve(promise).then(capability.resolve, reject);
          });
        });
        if (abrupt) reject(abrupt.error);
        return capability.promise;
      }
    });
  })($__require('52'));
});
$__System.registerDynamic('13', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var core = module.exports = { version: '1.2.6' };
  if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
});
$__System.registerDynamic('5e', ['2a', '2e', '3f', '5d', '13'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  $__require('2a');
  $__require('2e');
  $__require('3f');
  $__require('5d');
  module.exports = $__require('13').Promise;
});
$__System.registerDynamic("4", ["5e"], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = { "default": $__require("5e"), __esModule: true };
});
$__System.registerDynamic("5f", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function _filter(fn, list) {
    var idx = 0;
    var len = list.length;
    var result = [];

    while (idx < len) {
      if (fn(list[idx])) {
        result[result.length] = list[idx];
      }
      idx += 1;
    }
    return result;
  };
});
$__System.registerDynamic('60', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function _isObject(x) {
    return Object.prototype.toString.call(x) === '[object Object]';
  };
});
$__System.registerDynamic('61', ['7', '24'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry2 = $__require('7');
  var _xfBase = $__require('24');
  module.exports = function () {
    function XFilter(f, xf) {
      this.xf = xf;
      this.f = f;
    }
    XFilter.prototype['@@transducer/init'] = _xfBase.init;
    XFilter.prototype['@@transducer/result'] = _xfBase.result;
    XFilter.prototype['@@transducer/step'] = function (result, input) {
      return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
    };
    return _curry2(function _xfilter(f, xf) {
      return new XFilter(f, xf);
    });
  }();
});
$__System.registerDynamic('e', ['7', '26', '5f', '60', '62', '61', '63'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry2 = $__require('7');
  var _dispatchable = $__require('26');
  var _filter = $__require('5f');
  var _isObject = $__require('60');
  var _reduce = $__require('62');
  var _xfilter = $__require('61');
  var keys = $__require('63');
  module.exports = _curry2(_dispatchable('filter', _xfilter, function (pred, filterable) {
    return _isObject(filterable) ? _reduce(function (acc, key) {
      if (pred(filterable[key])) {
        acc[key] = filterable[key];
      }
      return acc;
    }, {}, keys(filterable)) : _filter(pred, filterable);
  }));
});
$__System.register("64", ["4", "9", "c", "d", "e"], function (_export) {
    var _Promise, map, flatten, compose, filter;

    return {
        setters: [function (_) {
            _Promise = _["default"];
        }, function (_2) {
            map = _2["default"];
        }, function (_c) {
            flatten = _c["default"];
        }, function (_d) {
            compose = _d["default"];
        }, function (_e) {
            filter = _e["default"];
        }],
        execute: function () {
            /**
             * Created by marcogobbi on 01/04/2017.
             */
            "use strict";

            _export("default", function (findMediator, hasMediator) {
                return compose(function (promises) {
                    return _Promise.all(promises);
                }, map(findMediator), filter(hasMediator), flatten);
            });
        }
    };
});
$__System.registerDynamic('65', ['66', '7'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _checkForMethod = $__require('66');
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
});
$__System.registerDynamic('67', ['68'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var isArrayLike = $__require('68');
  module.exports = function _makeFlat(recursive) {
    return function flatt(list) {
      var value, jlen, j;
      var result = [];
      var idx = 0;
      var ilen = list.length;
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
});
$__System.registerDynamic('c', ['69', '67'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry1 = $__require('69');
  var _makeFlat = $__require('67');
  module.exports = _curry1(_makeFlat(true));
});
$__System.register("6a", ["65", "c", "d"], function (_export) {
    /**
     * Created by marcogobbi on 01/04/2017.
     */
    "use strict";

    var forEach, flatten, compose;
    return {
        setters: [function (_) {
            forEach = _["default"];
        }, function (_c) {
            flatten = _c["default"];
        }, function (_d) {
            compose = _d["default"];
        }],
        execute: function () {
            _export("default", function (destroy) {
                return compose(forEach(destroy), flatten);
            });
        }
    };
});
$__System.registerDynamic('6b', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function _isTransformer(obj) {
    return typeof obj['@@transducer/step'] === 'function';
  };
});
$__System.registerDynamic('26', ['6c', '6b', '6d'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _isArray = $__require('6c');
  var _isTransformer = $__require('6b');
  var _slice = $__require('6d');
  module.exports = function _dispatchable(methodname, xf, fn) {
    return function () {
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
});
$__System.registerDynamic("6e", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
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
});
$__System.registerDynamic('24', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = {
    init: function () {
      return this.xf['@@transducer/init']();
    },
    result: function (result) {
      return this.xf['@@transducer/result'](result);
    }
  };
});
$__System.registerDynamic('6f', ['7', '24'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry2 = $__require('7');
  var _xfBase = $__require('24');
  module.exports = function () {
    function XMap(f, xf) {
      this.xf = xf;
      this.f = f;
    }
    XMap.prototype['@@transducer/init'] = _xfBase.init;
    XMap.prototype['@@transducer/result'] = _xfBase.result;
    XMap.prototype['@@transducer/step'] = function (result, input) {
      return this.xf['@@transducer/step'](result, this.f(input));
    };
    return _curry2(function _xmap(f, xf) {
      return new XMap(f, xf);
    });
  }();
});
$__System.registerDynamic('70', ['71', '72'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _arity = $__require('71');
  var _isPlaceholder = $__require('72');
  module.exports = function _curryN(length, received, fn) {
    return function () {
      var combined = [];
      var argsIdx = 0;
      var left = length;
      var combinedIdx = 0;
      while (combinedIdx < received.length || argsIdx < arguments.length) {
        var result;
        if (combinedIdx < received.length && (!_isPlaceholder(received[combinedIdx]) || argsIdx >= arguments.length)) {
          result = received[combinedIdx];
        } else {
          result = arguments[argsIdx];
          argsIdx += 1;
        }
        combined[combinedIdx] = result;
        if (!_isPlaceholder(result)) {
          left -= 1;
        }
        combinedIdx += 1;
      }
      return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
    };
  };
});
$__System.registerDynamic('21', ['71', '69', '7', '70'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _arity = $__require('71');
  var _curry1 = $__require('69');
  var _curry2 = $__require('7');
  var _curryN = $__require('70');
  module.exports = _curry2(function curryN(length, fn) {
    if (length === 1) {
      return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
  });
});
$__System.registerDynamic("73", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function _has(prop, obj) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
});
$__System.registerDynamic('74', ['73'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _has = $__require('73');
  module.exports = function () {
    var toString = Object.prototype.toString;
    return toString.call(arguments) === '[object Arguments]' ? function _isArguments(x) {
      return toString.call(x) === '[object Arguments]';
    } : function _isArguments(x) {
      return _has('callee', x);
    };
  }();
});
$__System.registerDynamic('63', ['69', '73', '74'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry1 = $__require('69');
  var _has = $__require('73');
  var _isArguments = $__require('74');
  module.exports = function () {
    var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
    var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
    var hasArgsEnumBug = function () {
      'use strict';

      return arguments.propertyIsEnumerable('length');
    }();
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
    return typeof Object.keys === 'function' && !hasArgsEnumBug ? _curry1(function keys(obj) {
      return Object(obj) !== obj ? [] : Object.keys(obj);
    }) : _curry1(function keys(obj) {
      if (Object(obj) !== obj) {
        return [];
      }
      var prop, nIdx;
      var ks = [];
      var checkArgsLength = hasArgsEnumBug && _isArguments(obj);
      for (prop in obj) {
        if (_has(prop, obj) && (!checkArgsLength || prop !== 'length')) {
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
});
$__System.registerDynamic('9', ['7', '26', '6e', '62', '6f', '21', '63'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry2 = $__require('7');
  var _dispatchable = $__require('26');
  var _map = $__require('6e');
  var _reduce = $__require('62');
  var _xmap = $__require('6f');
  var curryN = $__require('21');
  var keys = $__require('63');
  module.exports = _curry2(_dispatchable('map', _xmap, function map(fn, functor) {
    switch (Object.prototype.toString.call(functor)) {
      case '[object Function]':
        return curryN(functor.length, function () {
          return fn.call(this, functor.apply(this, arguments));
        });
      case '[object Object]':
        return _reduce(function (acc, key) {
          acc[key] = fn(functor[key]);
          return acc;
        }, {}, keys(functor));
      default:
        return _map(fn, functor);
    }
  }));
});
$__System.registerDynamic("75", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function _pipe(f, g) {
    return function () {
      return g.call(this, f.apply(this, arguments));
    };
  };
});
$__System.registerDynamic('76', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function () {
    function XWrap(fn) {
      this.f = fn;
    }
    XWrap.prototype['@@transducer/init'] = function () {
      throw new Error('init not implemented on XWrap');
    };
    XWrap.prototype['@@transducer/result'] = function (acc) {
      return acc;
    };
    XWrap.prototype['@@transducer/step'] = function (acc, x) {
      return this.f(acc, x);
    };

    return function _xwrap(fn) {
      return new XWrap(fn);
    };
  }();
});
$__System.registerDynamic('71', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function _arity(n, fn) {
    /* eslint-disable no-unused-vars */
    switch (n) {
      case 0:
        return function () {
          return fn.apply(this, arguments);
        };
      case 1:
        return function (a0) {
          return fn.apply(this, arguments);
        };
      case 2:
        return function (a0, a1) {
          return fn.apply(this, arguments);
        };
      case 3:
        return function (a0, a1, a2) {
          return fn.apply(this, arguments);
        };
      case 4:
        return function (a0, a1, a2, a3) {
          return fn.apply(this, arguments);
        };
      case 5:
        return function (a0, a1, a2, a3, a4) {
          return fn.apply(this, arguments);
        };
      case 6:
        return function (a0, a1, a2, a3, a4, a5) {
          return fn.apply(this, arguments);
        };
      case 7:
        return function (a0, a1, a2, a3, a4, a5, a6) {
          return fn.apply(this, arguments);
        };
      case 8:
        return function (a0, a1, a2, a3, a4, a5, a6, a7) {
          return fn.apply(this, arguments);
        };
      case 9:
        return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
          return fn.apply(this, arguments);
        };
      case 10:
        return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          return fn.apply(this, arguments);
        };
      default:
        throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
    }
  };
});
$__System.registerDynamic('77', ['71', '7'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _arity = $__require('71');
  var _curry2 = $__require('7');
  module.exports = _curry2(function bind(fn, thisObj) {
    return _arity(fn.length, function () {
      return fn.apply(thisObj, arguments);
    });
  });
});
$__System.registerDynamic('68', ['69', '6c'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry1 = $__require('69');
  var _isArray = $__require('6c');
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
});
$__System.registerDynamic('62', ['76', '77', '68'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _xwrap = $__require('76');
  var bind = $__require('77');
  var isArrayLike = $__require('68');
  module.exports = function () {
    function _arrayReduce(xf, acc, list) {
      var idx = 0;
      var len = list.length;
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
});
$__System.registerDynamic('78', ['79', '62'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry3 = $__require('79');
  var _reduce = $__require('62');
  module.exports = _curry3(_reduce);
});
$__System.registerDynamic('6c', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /**
   * Tests whether or not an object is an array.
   *
   * @private
   * @param {*} val The object to test.
   * @return {Boolean} `true` if `val` is an array, `false` otherwise.
   * @example
   *
   *      _isArray([]); //=> true
   *      _isArray(null); //=> false
   *      _isArray({}); //=> false
   */
  module.exports = Array.isArray || function _isArray(val) {
    return val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]';
  };
});
$__System.registerDynamic('66', ['6c', '6d'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _isArray = $__require('6c');
  var _slice = $__require('6d');
  module.exports = function _checkForMethod(methodname, fn) {
    return function () {
      var length = arguments.length;
      if (length === 0) {
        return fn();
      }
      var obj = arguments[length - 1];
      return _isArray(obj) || typeof obj[methodname] !== 'function' ? fn.apply(this, arguments) : obj[methodname].apply(obj, _slice(arguments, 0, length - 1));
    };
  };
});
$__System.registerDynamic('7', ['69', '72'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry1 = $__require('69');
  var _isPlaceholder = $__require('72');
  module.exports = function _curry2(fn) {
    return function f2(a, b) {
      switch (arguments.length) {
        case 0:
          return f2;
        case 1:
          return _isPlaceholder(a) ? f2 : _curry1(function (_b) {
            return fn(a, _b);
          });
        default:
          return _isPlaceholder(a) && _isPlaceholder(b) ? f2 : _isPlaceholder(a) ? _curry1(function (_a) {
            return fn(_a, b);
          }) : _isPlaceholder(b) ? _curry1(function (_b) {
            return fn(a, _b);
          }) : fn(a, b);
      }
    };
  };
});
$__System.registerDynamic('79', ['69', '7', '72'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry1 = $__require('69');
  var _curry2 = $__require('7');
  var _isPlaceholder = $__require('72');
  module.exports = function _curry3(fn) {
    return function f3(a, b, c) {
      switch (arguments.length) {
        case 0:
          return f3;
        case 1:
          return _isPlaceholder(a) ? f3 : _curry2(function (_b, _c) {
            return fn(a, _b, _c);
          });
        case 2:
          return _isPlaceholder(a) && _isPlaceholder(b) ? f3 : _isPlaceholder(a) ? _curry2(function (_a, _c) {
            return fn(_a, b, _c);
          }) : _isPlaceholder(b) ? _curry2(function (_b, _c) {
            return fn(a, _b, _c);
          }) : _curry1(function (_c) {
            return fn(a, b, _c);
          });
        default:
          return _isPlaceholder(a) && _isPlaceholder(b) && _isPlaceholder(c) ? f3 : _isPlaceholder(a) && _isPlaceholder(b) ? _curry2(function (_a, _b) {
            return fn(_a, _b, c);
          }) : _isPlaceholder(a) && _isPlaceholder(c) ? _curry2(function (_a, _c) {
            return fn(_a, b, _c);
          }) : _isPlaceholder(b) && _isPlaceholder(c) ? _curry2(function (_b, _c) {
            return fn(a, _b, _c);
          }) : _isPlaceholder(a) ? _curry1(function (_a) {
            return fn(_a, b, c);
          }) : _isPlaceholder(b) ? _curry1(function (_b) {
            return fn(a, _b, c);
          }) : _isPlaceholder(c) ? _curry1(function (_c) {
            return fn(a, b, _c);
          }) : fn(a, b, c);
      }
    };
  };
});
$__System.registerDynamic('7a', ['66', '79'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _checkForMethod = $__require('66');
  var _curry3 = $__require('79');
  module.exports = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
    return Array.prototype.slice.call(list, fromIndex, toIndex);
  }));
});
$__System.registerDynamic('7b', ['66', '7a'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _checkForMethod = $__require('66');
  var slice = $__require('7a');
  module.exports = _checkForMethod('tail', slice(1, Infinity));
});
$__System.registerDynamic('7c', ['71', '75', '78', '7b'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _arity = $__require('71');
  var _pipe = $__require('75');
  var reduce = $__require('78');
  var tail = $__require('7b');
  module.exports = function pipe() {
    if (arguments.length === 0) {
      throw new Error('pipe requires at least one argument');
    }
    return _arity(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
  };
});
$__System.registerDynamic('72', [], true, function ($__require, exports, module) {
       var global = this || self,
           GLOBAL = global;
       /* */
       module.exports = function _isPlaceholder(a) {
              return a != null && typeof a === 'object' && a['@@functional/placeholder'] === true;
       };
});
$__System.registerDynamic('69', ['72'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _isPlaceholder = $__require('72');
  module.exports = function _curry1(fn) {
    return function f1(a) {
      if (arguments.length === 0 || _isPlaceholder(a)) {
        return f1;
      } else {
        return fn.apply(this, arguments);
      }
    };
  };
});
$__System.registerDynamic('7d', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  module.exports = function _isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
  };
});
$__System.registerDynamic("6d", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /**
   * An optimized, private array `slice` implementation.
   *
   * @private
   * @param {Arguments|Array} args The array or arguments object to consider.
   * @param {Number} [from=0] The array index to slice from, inclusive.
   * @param {Number} [to=args.length] The array index to slice to, exclusive.
   * @return {Array} A new, sliced array.
   * @example
   *
   *      _slice([1, 2, 3, 4, 5], 1, 3); //=> [2, 3]
   *
   *      var firstThreeArgs = function(a, b, c, d) {
   *        return _slice(arguments, 0, 3);
   *      };
   *      firstThreeArgs(1, 2, 3, 4); //=> [1, 2, 3]
   */
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
});
$__System.registerDynamic('7e', ['69', '7d', '6d'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var _curry1 = $__require('69');
  var _isString = $__require('7d');
  var _slice = $__require('6d');
  module.exports = _curry1(function reverse(list) {
    return _isString(list) ? list.split('').reverse().join('') : _slice(list).reverse();
  });
});
$__System.registerDynamic('d', ['7c', '7e'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  /* */
  var pipe = $__require('7c');
  var reverse = $__require('7e');
  module.exports = function compose() {
    if (arguments.length === 0) {
      throw new Error('compose requires at least one argument');
    }
    return pipe.apply(this, reverse(arguments));
  };
});
$__System.register("b", [], function (_export) {
  /**
   * Created by marcogobbi on 01/04/2017.
   */

  "use strict";

  return {
    setters: [],
    execute: function () {
      _export("default", function (node) {
        return [node].concat([].slice.call(node.querySelectorAll("[data-mediator]"), 0));
      });
    }
  };
});
$__System.register("7f", ["9", "d", "b"], function (_export) {
    /**
     * Created by marcogobbi on 01/04/2017.
     */
    "use strict";

    var map, compose, getAllElements;
    return {
        setters: [function (_) {
            map = _["default"];
        }, function (_d) {
            compose = _d["default"];
        }, function (_b) {
            getAllElements = _b["default"];
        }],
        execute: function () {
            _export("default", function (getMediators) {
                return compose(getMediators, map(getAllElements), function () {
                    var root = arguments.length <= 0 || arguments[0] === undefined ? document.body : arguments[0];
                    return [root];
                });
            });
        }
    };
});
$__System.register("80", ["10", "29", "64", "f", "6a", "7f"], function (_export) {
    /**
     * Created by marco.gobbi on 21/01/2015.
     */
    "use strict";

    var Loader, MediatorHandler, GetMediators, DomWatcher, HandleNodesRemoved, Build;
    return {
        setters: [function (_) {
            Loader = _["default"];
        }, function (_2) {
            MediatorHandler = _2["default"];
        }, function (_3) {
            GetMediators = _3["default"];
        }, function (_f) {
            DomWatcher = _f["default"];
        }, function (_a) {
            HandleNodesRemoved = _a["default"];
        }, function (_f2) {
            Build = _f2["default"];
        }],
        execute: function () {
            _export("default", function (options) {
                var definitions = options.definitions;
                var _options$loader = options.loader;
                var loader = _options$loader === undefined ? Loader() : _options$loader;
                var _options$root = options.root;
                var root = _options$root === undefined ? document.body : _options$root;

                var handler = options.mediatorHandler || MediatorHandler({ definitions: definitions });
                var domWatcher = options.domWatcher || DomWatcher(root);
                //
                var getMediators = GetMediators(handler.findMediator(loader.load), handler.hasMediator);

                domWatcher.onAdded.connect(getMediators);
                domWatcher.onRemoved.connect(HandleNodesRemoved(handler.destroy));

                var bootstrap = Build(getMediators);

                return {
                    promise: bootstrap(root),
                    dispose: function dispose() {
                        domWatcher.dispose();
                        handler.dispose();
                    }
                };
            });
        }
    };
});
$__System.register("1", ["2", "5", "10", "29", "80", "1e", "1d", "f"], function (_export) {
    // import CustomElementHandler from "./display/CustomElementHandler";
    "use strict";

    var AmdLoader, Signal, Loader, MediatorHandler, bootstrap, EventDispatcher, makeDispatcher, RJSEvent, DomWatcher;
    return {
        setters: [function (_2) {
            AmdLoader = _2["default"];
        }, function (_3) {
            Signal = _3["default"];
        }, function (_) {
            Loader = _["default"];
        }, function (_4) {
            MediatorHandler = _4["default"];
        }, function (_5) {
            bootstrap = _5["default"];
        }, function (_e) {
            EventDispatcher = _e["default"];
            makeDispatcher = _e.makeDispatcher;
        }, function (_d) {
            RJSEvent = _d["default"];
        }, function (_f) {
            DomWatcher = _f["default"];
        }],
        execute: function () {
            _export("default", {
                bootstrap: bootstrap,
                MediatorHandler: MediatorHandler
                // , CustomElementHandler
                , DomWatcher: DomWatcher,
                Signal: Signal,
                RJSEvent: RJSEvent,
                makeDispatcher: makeDispatcher,
                EventDispatcher: EventDispatcher,
                Loader: Loader,
                AmdLoader: AmdLoader
            });
        }
    };
});
})
(function(factory) {
    if (typeof define == 'function' && define.amd)
        define("robojs",[], function(){
            return factory.apply(this,arguments).default
        });
    else if (typeof module == 'object' && module.exports && typeof require == 'function')
        module.exports = factory().default;
    else
        window.robojs=factory().default;
});
//# sourceMappingURL=robojs.es6.js.map