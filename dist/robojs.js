(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.robojs = global.robojs || {})));
}(this, (function (exports) { 'use strict';

var amdLoader = (function (id, resolve, reject) {
    require([id], resolve, reject);
});

var Loader = (function () {
    var loaderFunction = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : amdLoader;

    return Object.freeze({
        load: function load(id) {
            return new Promise(function (resolve, reject) {
                return loaderFunction(id, resolve, reject);
            });
        }
    });
});

var _classCallCheck = (function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

var EventDispatcher = function () {
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
                eventObj = new Event(eventObj);
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
}();

var eventDispatcher = new EventDispatcher();
var makeDispatcher = function makeDispatcher() {
    return new EventDispatcher();
};

var RJSEvent = function () {
    function RJSEvent(type) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var bubbles = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var cancelable = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

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
}();

function Signal() {

    var slots = [];

    function registrationPossible(listener, once, scope) {
        if (slots.length === 0) return true;
        var existingSlot = void 0;
        for (var i = 0; i < slots.length; i++) {
            var slot = slots[i];
            if (slot.listener === listener && slot.scope === scope) {
                existingSlot = slot;
                break;
            }
        }

        if (!existingSlot) return true;

        if (existingSlot.once !== once) {
            // If the listener was previously added, definitely don't add it again.
            // But throw an exception if their once values differ.
            throw new Error('You cannot addOnce() then add() the same listener without removing the relationship first.');
        }

        return false; // Listener was already registered.
    }

    function registerListener(listener, once, scope) {

        if (registrationPossible(listener, once, scope)) {
            var newSlot = { listener: listener, scope: scope, once: once };
            slots = slots.concat([newSlot]);
        }
        return slots;
    }

    function emit(value) {
        var length = slots.length;
        for (var i = 0; i < length; i++) {
            var _slots$i = slots[i],
                listener = _slots$i.listener,
                scope = _slots$i.scope,
                once = _slots$i.once;

            once && disconnect(listener, scope);
            listener.call(scope, value);
        }
    }

    var connect = function connect(listener, scope) {
        return registerListener(listener, false, scope);
    };

    var connectOnce = function connectOnce(listener, scope) {
        return registerListener(listener, true, scope);
    };

    function disconnect(listener, scope) {
        var filtered = [];
        for (var i = 0; i < slots.length; i++) {
            var slot = slots[i];
            if (slot.listener === listener && slot.scope === scope) {
                //
            } else {
                filtered.push(slot);
            }
        }
        slots = filtered;
        return slots;
    }

    function disconnectAll() {
        slots = [];
        return slots;
    }

    return Object.freeze({
        connect: connect,
        connectOnce: connectOnce,
        disconnect: disconnect,
        disconnectAll: disconnectAll,
        emit: emit

    });
}

/**
 * Created by mgobbi on 20/04/2017.
 */
var _arity = function (n, fn) {
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

/**
 * Created by mgobbi on 20/04/2017.
 */
function _curryN(length, received, fn) {
    return function () {
        var combined = [];
        var argsIdx = 0;
        var left = length;
        var combinedIdx = 0;
        while (combinedIdx < received.length || argsIdx < arguments.length) {
            var result;
            if (combinedIdx < received.length) {
                result = received[combinedIdx];
            } else {
                result = arguments[argsIdx];
                argsIdx += 1;
            }
            combined[combinedIdx] = result;
            {
                left -= 1;
            }
            combinedIdx += 1;
        }
        return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
    };
}

/**
 * Created by mgobbi on 20/04/2017.
 */
var _curry1 = function (fn) {
    return function f1(a) {
        if (arguments.length === 0) {
            return f1;
        } else {
            return fn.apply(this, arguments);
        }
    };
};

/**
 * Created by mgobbi on 14/03/2017.
 */
var curry = function (fn) {
    var length = fn.length;
    if (length === 1) {
        return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
};

/**
 * Created by mgobbi on 20/04/2017.
 */
var map = curry(function (fn, list) {
    //  return Array.from(list).map(fn);
    var idx = 0;
    var length = list.length;
    var result = [];
    for (idx; idx < length; idx++) {
        result[idx] = fn(list[idx]);
    }

    return result;
});

/**
 * Created by mgobbi on 20/04/2017.
 */
var pluck = curry(function (p, list) {
    return map(function (obj) {
        return obj[p];
    }, list);
});

/**
 * Created by marcogobbi on 20/04/2017.
 */
var reduce = curry(function (xf, acc, list) {
    var idx = 0;
    var len = list.length;
    while (idx < len) {
        acc = xf(acc, list[idx]);

        idx += 1;
    }
    return acc;

    /* var result=head.apply(ctx, args);
     var idx = 0;
     var len = tail.length;
     while (idx < len){
           result=tail[i].call(ctx, result);
         i--;
     }
     return result;*/
});

/**
 * Created by mgobbi on 17/03/2017.
 */
// Performs left-to-right composition of one or more  functions.
function _pipe(f, g) {
    return function () {
        return g.call(this, f.apply(this, arguments));
    };
}
var compose = function () {
    for (var _len = arguments.length, fns = Array(_len), _key = 0; _key < _len; _key++) {
        fns[_key] = arguments[_key];
    }

    fns.reverse();
    var head = fns[0];
    var tail = fns.slice(1);

    return _arity(head.length, reduce(_pipe, head, tail));
};

function _isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
}
var _isArrayLike = function (x) {
    if (Array.isArray(x)) {
        return true;
    }
    if (!x) {
        return false;
    }
    if (typeof x !== 'object') {
        return false;
    }
    if (_isString(x)) {
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
};

/**
 * Created by mgobbi on 12/04/2017.
 */
//  function flatten(arr) {
//     return arr.reduce(function (flat, toFlatten) {
//         return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
//     }, []);
// }
function flatten(list) {
    var value, jlen, j;
    var result = [];
    var idx = 0;
    var ilen = list.length;

    while (idx < ilen) {
        if (_isArrayLike(list[idx])) {
            value = flatten(list[idx]);
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
}

/**
 * Created by mgobbi on 20/04/2017.
 */
var filter = curry(function (fn, list) {
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
    //  return Array.from(list).filter(fn);
});

/**
 * Created by marcogobbi on 01/04/2017.
 */
//import map from "../../internal/_map"
//function identity(x){return x;}
var getAllElements = function (node) {
    //  var hrstart = process.hrtime();


    //  var nodes=map(identity,node.querySelectorAll("[data-mediator]"));
    var nodes = [].slice.call(node.querySelectorAll("[data-mediator]"), 0);
    if (!!node.getAttribute("data-mediator")) {
        nodes.unshift(node);
    }
    // var hrend = process.hrtime(hrstart);
    //  console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);
    return nodes;
};

/**
 * Created by marcogobbi on 01/04/2017.
 */
function makeChain(prop, emit) {
    return compose(function (nodes) {
        if (nodes.length > 0) {
            return emit(nodes);
        } else {
            return [];
        }
    }, filter(function (nodes) {
        return nodes.length > 0;
    }), map(getAllElements), filter(function (node) {
        return node.querySelectorAll;
    }), flatten, pluck(prop) //"addedNodes","removedNodes"
    );
}

var DomWatcher = (function (root) {
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

    return Object.freeze({ onAdded: onAdded, onRemoved: onRemoved, dispose: dispose });
});

/**
 * Created by mgobbi on 31/03/2017.
 */
var REG_EXP = /[xy]/g;
var STRING = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
var nextUid = (function () {
    return STRING.replace(REG_EXP, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });
});

/**
 * Created by mgobbi on 31/03/2017.
 */
var noop = function noop(_) {
    return _;
};

var create = curry(function (node, dispatcher, Mediator) {
    var mediatorId = nextUid();
    node.setAttribute('mediatorid', mediatorId);
    var dispose = Mediator(node, dispatcher) || noop;
    return {
        mediatorId: mediatorId,
        node: node,
        dispose: dispose
    };
});

/**
 * Created by mgobbi on 20/04/2017.
 */
var find = curry(function (fn, list) {
    var idx = 0;
    var len = list.length;
    while (idx < len) {
        if (fn(list[idx])) {
            return list[idx];
        }
        idx += 1;
    }
});

/**
 * Created by mgobbi on 31/03/2017.
 */
var inCache = (function (MEDIATORS_CACHE, node) {
  return !!find(function (disposable) {
    return disposable.node === node;
  }, MEDIATORS_CACHE);
});

/**
 * Created by marcogobbi on 02/04/2017.
 */
var FindMediator = (function (getDefinition, create, updateCache) {
    return curry(function (dispatcher, load, node) {
        return load(getDefinition(node)).then(create(node, dispatcher)).then(updateCache);
    });
});

/**
 * Created by marco.gobbi on 21/01/2015.
 */

var GetDefinition = curry(function (definitions, node) {
    return definitions[node.getAttribute("data-mediator")];
});

var MediatorHandler = function (params) {
    //crea un'istanza dell'EventDispatcher se non viene passata
    var _params$definitions = params.definitions,
        definitions = _params$definitions === undefined ? {} : _params$definitions,
        _params$dispatcher = params.dispatcher,
        dispatcher = _params$dispatcher === undefined ? makeDispatcher() : _params$dispatcher;
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
                MEDIATORS_CACHE.splice(i, 1);
            }
        }

        //MEDIATORS_CACHE = MEDIATORS_CACHE.filter(m => m);
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

    function hasMediator(node) {
        return !!getDefinition(node) && !inCache(MEDIATORS_CACHE, node);
    }

    return Object.freeze({
        dispose: dispose,
        destroy: destroy,
        findMediator: _findMediator(dispatcher),
        hasMediator: hasMediator,
        getAllElements: getAllElements

    });
};

/**
 * Created by marcogobbi on 01/04/2017.
 */
var GetMediators = function (findMediator, hasMediator) {
    return compose(function (promises) {
        return Promise.all(promises);
    }, map(findMediator), filter(hasMediator), flatten);
};

/**
 * Created by mgobbi on 20/04/2017.
 */
var forEach = curry(function (fn, list) {
    var len = list.length;
    var idx = 0;
    while (idx < len) {
        fn(list[idx]);
        idx += 1;
    }
    return list;
});

/**
 * Created by marcogobbi on 01/04/2017.
 */
var HandleNodesRemoved = function (destroy) {
  return compose(forEach(destroy), flatten);
};

/**
 * Created by marcogobbi on 01/04/2017.
 */
var Build = function (getMediators) {
    return compose(getMediators, map(getAllElements), function (root) {
        return [root];
    });
};

/**
 * Created by marco.gobbi on 21/01/2015.
 */
var bootstrap = (function (options) {
    var definitions = options.definitions,
        _options$loader = options.loader,
        loader = _options$loader === undefined ? Loader() : _options$loader,
        _options$root = options.root,
        root = _options$root === undefined ? document.body : _options$root;

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

exports.bootstrap = bootstrap;
exports.MediatorHandler = MediatorHandler;
exports.DomWatcher = DomWatcher;
exports.Signal = Signal;
exports.RJSEvent = RJSEvent;
exports.makeDispatcher = makeDispatcher;
exports.EventDispatcher = eventDispatcher;
exports.Loader = Loader;

Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=robojs.js.map