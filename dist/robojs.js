(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define('robojs', ['exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.robojs = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    var amdLoader = function amdLoader(id, resolve, reject) {
        window.require([id], resolve, reject);
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

    /**
     * Creates a new EventTarget. This class implements the DOM level 2
     * EventTarget interface and can be used wherever those are used.
     * @constructor
     * @implements {EventTarget}
     */
    var _EventTarget = function () {
        var G = (typeof global === 'undefined' ? 'undefined' : _typeof(global)) === _typeof(null) ? global : self;
        var EventTarget = G.EventTarget;
        try {
            new EventTarget();
        } catch (e) {
            EventTarget = function EventTarget() {};
            EventTarget.prototype = {
                /**
                 * Adds an event listener to the target.
                 * @param {string} type The name of the event.
                 * @param {EventListenerType} handler The handler for the event. This is
                 *     called when the event is dispatched.
                 */
                addEventListener: function addEventListener(type, handler) {
                    if (!this.listeners_) this.listeners_ = Object.create(null);
                    if (!(type in this.listeners_)) {
                        this.listeners_[type] = [handler];
                    } else {
                        var handlers = this.listeners_[type];
                        if (handlers.indexOf(handler) < 0) {

                            handlers.push(handler);
                        }
                    }
                },

                /**
                 * Removes an event listener from the target.
                 * @param {string} type The name of the event.
                 * @param {EventListenerType} handler The handler for the event.
                 */
                removeEventListener: function removeEventListener(type, handler) {
                    if (!this.listeners_) return;
                    if (type in this.listeners_) {
                        var handlers = this.listeners_[type];
                        var index = handlers.indexOf(handler);

                        if (index >= 0) {

                            // Clean up if this was the last listener.
                            if (handlers.length === 1) {
                                delete this.listeners_[type];
                            } else {
                                handlers.splice(index, 1);
                            }
                        }
                    }
                },

                /**
                 * Dispatches an event and calls all the listeners that are listening to
                 * the type of the event.
                 * @param {!Event} event The event to dispatch.
                 * @return {boolean} Whether the default action was prevented. If someone
                 *     calls preventDefault on the event object then this returns false.
                 */
                dispatchEvent: function dispatchEvent(event) {
                    if (!this.listeners_) return true;

                    // Since we are using DOM Event objects we need to override some of the
                    // properties and methods so that we can emulate this correctly.
                    var self = this;
                    event.__defineGetter__('target', function () {
                        return self;
                    });

                    var type = event.type;
                    var prevented = 0;
                    if (type in this.listeners_) {
                        // Clone to prevent removal during dispatch
                        var handlers = this.listeners_[type].concat();
                        for (var i = 0, handler; handler = handlers[i]; i++) {
                            if (handler.handleEvent) prevented |= handler.handleEvent.call(handler, event) === false;else prevented |= handler.call(this, event) === false;
                        }
                    }

                    return !prevented && !event.defaultPrevented;
                }
            };
        }

        return EventTarget;
    }();

    var eventDispatcher = new _EventTarget();
    var makeDispatcher = function makeDispatcher() {
        return new _EventTarget();
    };

    function Signal() {

        this.listenerBoxes = [];

        this.listenersNeedCloning = false;
    }

    Signal.prototype = {
        getNumListeners: function getNumListeners() {
            return this.listenerBoxes.length;
        },

        connect: function connect(slot, scope) {
            this.registerListener(slot, scope, false);
        },

        connectOnce: function connectOnce(slot, scope) {
            this.registerListener(slot, scope, true);
        },

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

        disconnectAll: function disconnectAll() {

            for (var i = this.listenerBoxes.length; i--;) {
                this.disconnect(this.listenerBoxes[i].listener, this.listenerBoxes[i].scope);
            }
        },

        emit: function emit() {
            var _this = this;

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            this.listenersNeedCloning = true;
            this.listenerBoxes.forEach(function (_ref) {
                var scope = _ref.scope,
                    listener = _ref.listener,
                    once = _ref.once;

                if (once) {
                    _this.disconnect(listener, scope);
                }
                listener.apply(scope, args);
            });

            this.listenersNeedCloning = false;
        },

        registerListener: function registerListener(listener, scope, once) {
            var _listeners = this.listenerBoxes.filter(function (box) {
                return box.listener === listener && box.scope === scope;
            });

            if (!_listeners.length) {
                if (this.listenersNeedCloning) {
                    this.listenerBoxes = this.listenerBoxes.slice();
                }

                this.listenerBoxes.push({ listener: listener, scope: scope, once: once });
            } else {
                //
                var addOnce_add = _listeners.find(function (box) {
                    return box.once && !once;
                });
                var add_addOnce = _listeners.find(function (box) {
                    return once && !box.once;
                });

                if (!!addOnce_add) {
                    throw new Error('You cannot addOnce() then try to add() the same listener ' + 'without removing the relationship first.');
                }
                if (!!add_addOnce) {
                    throw new Error('You cannot add() then addOnce() the same listener ' + 'without removing the relationship first.');
                }
            }
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

    function compose() {
        for (var _len2 = arguments.length, fns = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            fns[_key2] = arguments[_key2];
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
    }var _isArray = Array.isArray || function (val) {
        return val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]';
    };
    function _isArrayLike(x) {

        if (_isArray(x)) {
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

    function unique(arrArg) {
        return arrArg.filter(function (elem, pos, arr) {
            return arr.indexOf(elem) == pos;
        });
    }

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
        }, unique, flatten, filter(function (nodes) {
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
        var disposable = {
            mediatorId: mediatorId,
            node: node,
            dispose: noop
        };
        if (!!node.parentNode) {

            var dispose = Mediator(node, dispatcher) || noop;
            disposable = {
                mediatorId: mediatorId,
                node: node,
                dispose: dispose
            };
        }
        return disposable;
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

    function _destroy(node, MEDIATORS_CACHE) {
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

    function MediatorHandler(params) {
        var _ref2 = params || {},
            _ref2$definitions = _ref2.definitions,
            definitions = _ref2$definitions === undefined ? {} : _ref2$definitions,
            _ref2$dispatcher = _ref2.dispatcher,
            dispatcher = _ref2$dispatcher === undefined ? makeDispatcher() : _ref2$dispatcher;

        //inizializza la cache dei mediatori registrati
        var MEDIATORS_CACHE = [];
        var getDefinition = GetDefinition(definitions);

        function dispose() {
            MEDIATORS_CACHE.forEach(function (disposable) {
                if (disposable) {
                    disposable.dispose();
                    disposable.node = null;
                }
            });
            MEDIATORS_CACHE = null;
            dispatcher.listeners_ = null;
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
            destroy: function destroy(node) {
                return _destroy(node, MEDIATORS_CACHE);
            },
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
        var _params$definitions = params.definitions,
            definitions = _params$definitions === undefined ? {} : _params$definitions,
            _params$dispatcher = params.dispatcher,
            dispatcher = _params$dispatcher === undefined ? makeDispatcher() : _params$dispatcher;


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
    exports.Signal = Signal;
    exports.DomWatcher = DomWatcher;
    exports.MediatorHandler = MediatorHandler;
    exports.bootstrap = bootstrap;
    exports.CustomElementHandler = customElementHandler;
});
