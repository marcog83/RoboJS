'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (global, factory) {
    (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : factory(global.robojs = {});
})(undefined, function (exports) {
    'use strict';

    var amdLoader = function amdLoader(id, resolve, reject) {
        require([id], resolve, reject);
    };

    var Loader = function Loader() {
        var loaderFunction = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : amdLoader;

        return Object.freeze({
            load: function load(id) {
                return new Promise(function (resolve, reject) {
                    return loaderFunction(id, resolve, reject);
                });
            }
        });
    };

    function EventDispatcher() {
        this._listeners = {};
    }
    EventDispatcher.prototype = {
        addEventListener: function addEventListener(type, listener, useCapture) {
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
        },
        removeEventListener: function removeEventListener(type, listener, useCapture) {
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
        },
        removeAllEventListeners: function removeAllEventListeners(type) {
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
        },
        dispatchEvent: function dispatchEvent(eventObj) {
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
        },
        hasEventListener: function hasEventListener(type) {
            var listeners = this._listeners,
                captureListeners = this._captureListeners;
            return !!(listeners && listeners[type] || captureListeners && captureListeners[type]);
        },
        _dispatchEvent: function _dispatchEvent(eventObj, eventPhase) {
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
    };
    var eventDispatcher = new EventDispatcher();
    var makeDispatcher = function makeDispatcher() {
        return new EventDispatcher();
    };

    function RJSEvent(type) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var bubbles = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var cancelable = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

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

    RJSEvent.prototype = {
        preventDefault: function preventDefault() {
            this.defaultPrevented = true;
        },
        stopPropagation: function stopPropagation() {
            this.propagationStopped = true;
        },
        stopImmediatePropagation: function stopImmediatePropagation() {
            this.immediatePropagationStopped = this.propagationStopped = true;
        },
        remove: function remove() {
            this.removed = true;
        },
        clone: function clone() {
            return new RJSEvent(this.type, this.data, this.bubbles, this.cancelable);
        }
    };

    function Signal() {

        this.listenerBoxes = [];

        this._valueClasses = null;

        this.listenersNeedCloning = false;

        this.setValueClasses(arguments);
    }

    Signal.prototype = {
        getNumListeners: function getNumListeners() {
            return this.listenerBoxes.length;
        },
        getValueClasses: function getValueClasses() {
            return this._valueClasses;
        },
        /**
         <h3>connect</h3>
         <p>Connects the signal this to the incoming slot.</p>
         @param <code>Function</code> the slot function
         @param <code>Object</code> the scope of slot function execution
         */
        connect: function connect(slot, scope) {
            this.registerListener(slot, scope, false);
        },
        /**
         <h3>connectOnce</h3>
         <p></p>
         @param <code>Function</code> the slot function
         @param <code>Object</code> the scope of slot function execution
         */
        connectOnce: function connectOnce(slot, scope) {
            this.registerListener(slot, scope, true);
        },
        /**
         <h3>disconnect</h3>
         <p>the given slot are disconnected.</p>
         @param <code>Function</code> the slot function
         @param <code>Object</code> the scope of slot function execution
         */
        disconnect: function disconnect(slot, scope) {
            if (this.listenersNeedCloning) {
                this.listenerBoxes = this.listenerBoxes.slice();
                this.listenersNeedCloning = false;
            }

            for (var i = this.listenerBoxes.length; i--;) {
                if (this.listenerBoxes[i].listener == slot && this.listenerBoxes[i].scope == scope) {
                    this.listenerBoxes.splice(i, 1);
                    return;
                }
            }
        },
        /**
         <h3>disconnectAll</h3>
         <p>Disconnects all slots connected to the signal.</p>
           */
        disconnectAll: function disconnectAll() {

            for (var i = this.listenerBoxes.length; i--;) {
                this.disconnect(this.listenerBoxes[i].listener, this.listenerBoxes[i].scope);
            }
        },
        /**
         <h3>emit</h3>
         <p>Dispatches an event into the signal flow.</p>
           */
        emit: function emit() {
            var valueObject;
            for (var n = 0; n < this._valueClasses.length; n++) {
                if (this.primitiveMatchesValueClass(arguments[n], this._valueClasses[n])) continue;

                if ((valueObject = arguments[n]) == null || valueObject instanceof this._valueClasses[n]) continue;

                throw new Error('Value object <' + valueObject + '> is not an instance of <' + this._valueClasses[n] + '>.');
            }

            var listenerBoxes = this.listenerBoxes;
            var len = listenerBoxes.length;
            var listenerBox;

            this.listenersNeedCloning = true;
            for (var i = 0; i < len; i++) {
                listenerBox = listenerBoxes[i];
                if (listenerBox.once) this.disconnect(listenerBox.listener, listenerBox.scope);

                listenerBox.listener.apply(listenerBox.scope, arguments);
            }
            this.listenersNeedCloning = false;
        },
        primitiveMatchesValueClass: function primitiveMatchesValueClass(primitive, valueClass) {
            if (typeof primitive == "string" && valueClass == String || typeof primitive == "number" && valueClass == Number || typeof primitive == "boolean" && valueClass == Boolean) return true;

            return false;
        },
        setValueClasses: function setValueClasses(valueClasses) {
            this._valueClasses = valueClasses || [];

            for (var i = this._valueClasses.length; i--;) {
                if (!(this._valueClasses[i] instanceof Function)) throw new Error('Invalid valueClasses argument: item at index ' + i + ' should be a Class but was:<' + this._valueClasses[i] + '>.');
            }
        },
        registerListener: function registerListener(listener, scope, once) {
            for (var i = 0; i < this.listenerBoxes.length; i++) {
                if (this.listenerBoxes[i].listener == listener && this.listenerBoxes[i].scope == scope) {
                    if (this.listenerBoxes[i].once && !once) {
                        throw new Error('You cannot addOnce() then try to add() the same listener ' + 'without removing the relationship first.');
                    } else if (once && !this.listenerBoxes[i].once) {
                        throw new Error('You cannot add() then addOnce() the same listener ' + 'without removing the relationship first.');
                    }
                    return;
                }
            }
            if (this.listenersNeedCloning) {
                this.listenerBoxes = this.listenerBoxes.slice();
            }

            this.listenerBoxes.push({ listener: listener, scope: scope, once: once });
        }
    };

    /**
     * Created by mgobbi on 20/04/2017.
     */
    function _arity(n, fn) {
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
    }

    var noop = function noop(_) {
        return _;
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
    function _curry1(fn) {
        return function f1(a) {
            if (arguments.length === 0) {
                return f1;
            } else {
                return fn.apply(this, arguments);
            }
        };
    }

    /**
     * Created by mgobbi on 14/03/2017.
     */
    function curry(fn) {
        var length = fn.length;
        if (length === 1) {
            return _curry1(fn);
        }
        return _arity(length, _curryN(length, [], fn));
    }

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

    function _pipe(f, g) {
        return function () {
            return g.call(this, f.apply(this, arguments));
        };
    }

    /**
     * Created by mgobbi on 17/03/2017.
     */
    // Performs left-to-right composition of one or more  functions.
    function compose() {
        for (var _len = arguments.length, fns = Array(_len), _key = 0; _key < _len; _key++) {
            fns[_key] = arguments[_key];
        }

        fns.reverse();
        var head = fns[0];
        var tail = fns.slice(1);

        return _arity(head.length, reduce(_pipe, head, tail));
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

    function _isString(x) {
        return Object.prototype.toString.call(x) === '[object String]';
    }
    function _isArrayLike(x) {
        if (Array.isArray(x)) {
            return true;
        }
        if (!x) {
            return false;
        }
        if ((typeof x === 'undefined' ? 'undefined' : _typeof(x)) !== 'object') {
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
    }

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
     * Created by marcogobbi on 01/04/2017.
     */
    function makeChain(prop, getAllElements, emit) {
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

    var DomWatcher = function DomWatcher(root, getAllElements) {
        var onAdded = new Signal();
        var onRemoved = new Signal();

        var getAdded = makeChain("addedNodes", getAllElements, onAdded.emit.bind(onAdded));
        var getRemoved = makeChain("removedNodes", getAllElements, onRemoved.emit.bind(onRemoved));

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
            observer = null;
            onAdded = null;
            onRemoved = null;
            getAdded = null;
            getRemoved = null;
        }

        return Object.freeze({ onAdded: onAdded, onRemoved: onRemoved, dispose: dispose });
    };

    /**
     * Created by mgobbi on 31/03/2017.
     */
    var REG_EXP = /[xy]/g;
    var STRING = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    var nextUid = function nextUid() {
        return STRING.replace(REG_EXP, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    };

    /**
     * Created by mgobbi on 31/03/2017.
     */
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
     * Created by mgobbi on 31/03/2017.
     */
    var inCache = function inCache(MEDIATORS_CACHE, node) {
        return !!find(function (disposable) {
            return disposable.node === node;
        }, MEDIATORS_CACHE);
    };

    /**
     * Created by marcogobbi on 01/04/2017.
     */
    function getAllElements(node) {

        var nodes = [].slice.call(node.querySelectorAll("[data-mediator]"), 0);
        if (!!node.getAttribute("data-mediator")) {
            nodes.unshift(node);
        }
        return nodes;
    }

    /**
     * Created by marcogobbi on 02/04/2017.
     */
    var FindMediator = function FindMediator(getDefinition, create, updateCache) {
        return curry(function (dispatcher, load, node) {
            return load(getDefinition(node)).then(create(node, dispatcher)).then(updateCache);
        });
    };

    /**
     * Created by marco.gobbi on 21/01/2015.
     */

    var GetDefinition = curry(function (definitions, node) {
        return definitions[node.getAttribute("data-mediator")];
    });

    function MediatorHandler(params) {
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

            return MEDIATORS_CACHE;
        }

        function dispose() {
            MEDIATORS_CACHE.forEach(function (disposable) {
                if (disposable) {
                    disposable.dispose();
                    disposable.node = null;
                }
            });
            MEDIATORS_CACHE = null;
            dispatcher.removeAllEventListeners();
            dispatcher = null;
            _findMediator = null;
            definitions = null;
            getDefinition = null;
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
    }

    /**
     * Created by marcogobbi on 01/04/2017.
     */
    function GetMediators(findMediator, hasMediator) {
        return compose(function (promises) {
            return Promise.all(promises);
        }, map(findMediator), filter(hasMediator), flatten);
    }

    /**
     * Created by marcogobbi on 01/04/2017.
     */
    function HandleNodesRemoved(destroy) {
        return compose(forEach(destroy), flatten);
    }

    /**
     * Created by marcogobbi on 01/04/2017.
     */
    function Build(getMediators, getAllElements) {
        return compose(getMediators, map(getAllElements), function (root) {
            return [root];
        });
    }

    /**
     * Created by marco.gobbi on 21/01/2015.
     */

    var bootstrap = function bootstrap(options) {
        var definitions = options.definitions,
            _options$loader = options.loader,
            loader = _options$loader === undefined ? Loader() : _options$loader,
            _options$root = options.root,
            root = _options$root === undefined ? document.body : _options$root;


        var handler = options.handler || MediatorHandler({ definitions: definitions });
        var domWatcher = options.domWatcher || DomWatcher(root, handler.getAllElements);
        //


        var getMediators = GetMediators(handler.findMediator(loader.load), handler.hasMediator);

        domWatcher.onAdded.connect(getMediators);
        domWatcher.onRemoved.connect(HandleNodesRemoved(handler.destroy));

        var promise = Build(getMediators, handler.getAllElements)(root);

        return {
            promise: promise,
            dispose: function dispose() {
                domWatcher.dispose();
                handler.dispose();
                domWatcher = null;
                handler = null;
                getMediators = null;
                definitions = null;
                loader = null;
                root = null;
                promise = null;
            }
        };
    };

    //

    /**
     * Created by marcogobbi on 07/05/2017.
     */
    var KE = ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1 ", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "main", "map", "mark", "menu", "menuitem", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"];
    var query = KE.map(function (e) {
        return ":not(" + e + ")";
    }).reduce(function (prev, curr) {
        return prev + curr;
    }, "*");

    function getAllElements$1(node) {
        return [node].concat([].slice.call(node.querySelectorAll(query), 0));
    }

    /**
     * Created by marcogobbi on 07/05/2017.
     */

    function getCreate(inCache, updateCache) {

        return function create(node, dispatcher) {
            return function (Mediator) {
                var tagName = "";
                if (!inCache(node.tagName.toLowerCase())) {
                    tagName = node.tagName.toLowerCase();
                    if (!tagName.match(/-/gim)) {
                        throw new Error("The name of a custom element must contain a dash (-). So <x-tags>, <my-element>, and <my-awesome-app> are all valid names, while <tabs> and <foo_bar> are not.");
                    }
                    window.customElements.define(tagName, function (_Mediator) {
                        _inherits(_class, _Mediator);

                        function _class() {
                            _classCallCheck(this, _class);

                            return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, dispatcher));
                        }

                        return _class;
                    }(Mediator));
                    //  var proto = Object.assign(Object.create(HTMLElement.prototype), customProto);
                    //   document.registerElement(tagName, {prototype: proto});
                    updateCache(tagName);
                }
                return tagName;
            };
        };
    }

    /**
     * Created by marcogobbi on 07/05/2017.
     */
    var GetDefinition$1 = curry(function (definitions, node) {
        return definitions[node.tagName.toLowerCase()];
    });

    var customElementHandler = function customElementHandler(params) {
        //crea un'istanza dell'EventDispatcher se non viene passata
        var _params$definitions2 = params.definitions,
            definitions = _params$definitions2 === undefined ? {} : _params$definitions2,
            _params$dispatcher2 = params.dispatcher,
            dispatcher = _params$dispatcher2 === undefined ? makeDispatcher() : _params$dispatcher2;


        var REGISTERED_ELEMENTS = {};

        function updateCache(id) {
            REGISTERED_ELEMENTS[id] = true;
            return REGISTERED_ELEMENTS;
        }

        var inCache = curry(function (elements, id) {
            return !!elements[id];
        });

        var getDefinition = GetDefinition$1(definitions);
        var _findMediator = FindMediator(getDefinition, getCreate(inCache(REGISTERED_ELEMENTS), updateCache), noop);

        function hasMediator(node) {
            var id = node.tagName.toLowerCase();
            return !!getDefinition(node) && !inCache(REGISTERED_ELEMENTS, id);
        }

        return Object.freeze({
            dispose: noop,
            destroy: noop,
            findMediator: _findMediator(dispatcher),
            hasMediator: hasMediator,
            getAllElements: getAllElements$1

        });
    };

    exports.Loader = Loader;
    exports.EventDispatcher = eventDispatcher;
    exports.makeDispatcher = makeDispatcher;
    exports.RJSEvent = RJSEvent;
    exports.Signal = Signal;
    exports.DomWatcher = DomWatcher;
    exports.MediatorHandler = MediatorHandler;
    exports.bootstrap = bootstrap;
    exports.CustomElementHandler = customElementHandler;

    Object.defineProperty(exports, '__esModule', { value: true });
});
