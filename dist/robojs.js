(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define("robojs", ["exports"], factory);
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
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

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

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
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
    }();

    var Loader = function () {
        function Loader() {
            _classCallCheck(this, Loader);
        }

        _createClass(Loader, [{
            key: "load",
            value: function load(id) {
                var _this = this;

                return new Promise(function (resolve, reject) {
                    return _this.onComplete(id, resolve, reject);
                });
            }
        }, {
            key: "onComplete",
            value: function onComplete(id, resolve, reject) {}
        }]);

        return Loader;
    }();

    var AMDLoader = function (_Loader) {
        _inherits(AMDLoader, _Loader);

        function AMDLoader() {
            _classCallCheck(this, AMDLoader);

            return _possibleConstructorReturn(this, (AMDLoader.__proto__ || Object.getPrototypeOf(AMDLoader)).apply(this, arguments));
        }

        _createClass(AMDLoader, [{
            key: "onComplete",
            value: function onComplete(id, resolve, reject) {
                window.require([id], resolve, reject);
            }
        }]);

        return AMDLoader;
    }(Loader);

    var EventTarget = function () {
        function EventTarget() {
            _classCallCheck(this, EventTarget);

            this.listeners_ = {};
        }

        /**
         * Adds an event listener to the target.
         * @param {string} type The name of the event.
         * @param {EventListenerType} handler The handler for the event. This is
         *     called when the event is dispatched.
         */


        _createClass(EventTarget, [{
            key: "addEventListener",
            value: function addEventListener(type, handler) {

                if (!(type in this.listeners_)) {
                    this.listeners_[type] = [handler];
                } else {
                    var handlers = this.listeners_[type];
                    if (handlers.indexOf(handler) < 0) {

                        handlers.push(handler);
                    }
                }
            }
        }, {
            key: "removeEventListener",
            value: function removeEventListener(type, handler) {

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
            }
        }, {
            key: "dispatchEvent",
            value: function dispatchEvent(event) {
                // Since we are using DOM Event objects we need to override some of the
                // properties and methods so that we can emulate this correctly.
                var self = this;
                event.__defineGetter__("target", function () {
                    return self;
                });

                var type = event.type;
                var prevented = 0;
                if (type in this.listeners_) {
                    // Clone to prevent removal during dispatch
                    var handlers = this.listeners_[type].concat();

                    for (var i = 0; i < handlers.length; i++) {
                        var handler = handlers[i];
                        if (handler.handleEvent) {
                            prevented |= handler.handleEvent.call(handler, event) === false;
                        } else {
                            prevented |= handler.call(this, event) === false;
                        }
                    }
                }

                return !prevented && !event.defaultPrevented;
            }
        }]);

        return EventTarget;
    }();

    var G = (typeof global === "undefined" ? "undefined" : _typeof(global)) === _typeof(null) ? global : self;

    var _EventTarget = G.EventTarget;

    try {} catch (e) {
        _EventTarget = EventTarget;
    }
    var EventTarget$1 = _EventTarget;

    /**
     *
     * @constructor
     * @return {Signal}
     */

    var Signal = function () {
        function Signal() {
            _classCallCheck(this, Signal);

            this.listenerBoxes = [];

            this.listenersNeedCloning = false;
        }

        _createClass(Signal, [{
            key: "getNumListeners",
            value: function getNumListeners() {
                return this.listenerBoxes.length;
            }
        }, {
            key: "connect",
            value: function connect(slot, scope) {
                this.registerListener(slot, scope, false);
            }
        }, {
            key: "connectOnce",
            value: function connectOnce(slot, scope) {
                this.registerListener(slot, scope, true);
            }
        }, {
            key: "disconnect",
            value: function disconnect(slot, scope) {
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
            }
        }, {
            key: "disconnectAll",
            value: function disconnectAll() {

                for (var i = this.listenerBoxes.length; i--;) {
                    this.disconnect(this.listenerBoxes[i].listener, this.listenerBoxes[i].scope);
                }
            }
        }, {
            key: "emit",
            value: function emit() {
                var _this3 = this;

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                this.listenersNeedCloning = true;
                this.listenerBoxes.forEach(function (_ref) {
                    var scope = _ref.scope,
                        listener = _ref.listener,
                        once = _ref.once;

                    if (once) {
                        _this3.disconnect(listener, scope);
                    }
                    listener.apply(scope, args);
                });

                this.listenersNeedCloning = false;
            }
        }, {
            key: "registerListener",
            value: function registerListener(listener, scope, once) {
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

                    if (addOnce_add) {
                        throw new Error("You cannot addOnce() then try to add() the same listener " + "without removing the relationship first.");
                    }
                    if (add_addOnce) {
                        throw new Error("You cannot add() then addOnce() the same listener " + "without removing the relationship first.");
                    }
                }
            }
        }]);

        return Signal;
    }();

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
                throw new Error("First argument to _arity must be a non-negative integer no greater than ten");
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
                var result = void 0;
                if (combinedIdx < received.length) {
                    result = received[combinedIdx];
                } else {
                    result = arguments[argsIdx];
                    argsIdx += 1;
                }
                combined[combinedIdx] = result;
                left -= 1;
                combinedIdx += 1;
            }
            return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
        };
    }

    /**
     * Created by mgobbi on 20/04/2017.
     */
    function _curry1(fn) {
        return function f1() {
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

    curry(function (xf, acc, list) {
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

    var _isArray = function _isArray(val) {
        return val != null && val.length >= 0 && Object.prototype.toString.call(val) === "[object Array]";
    };

    function _isString(x) {
        return Object.prototype.toString.call(x) === "[object String]";
    }

    function _isArrayLike(x) {
        var isArray = Array.isArray || _isArray;
        if (!x) {
            return false;
        }
        if (isArray(x)) {
            return true;
        }

        if ("object" !== (typeof x === "undefined" ? "undefined" : _typeof(x))) {

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
        var value = void 0,
            jlen = void 0,
            j = void 0;
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
    curry(function (fn, list) {
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
    curry(function (p, list) {
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
     *
     * @param root {HTMLElement}
     * @param getAllElements {Handler_getAllElements}
     * @return {DomWatcher}
     */

    var DomWatcher = function () {
        function DomWatcher(root, getAllElements) {
            _classCallCheck(this, DomWatcher);

            this.onAdded = new Signal();
            this.onRemoved = new Signal();
            this.root = root;
            this.getAllElements = getAllElements;
            this.init();
        }

        _createClass(DomWatcher, [{
            key: "init",
            value: function init() {
                this.observer = new MutationObserver(this.handleMutations.bind(this));
                this.observer.observe(this.root, {
                    attributes: false, //true
                    childList: true,
                    characterData: false,
                    subtree: true
                });
            }
        }, {
            key: "handleMutations",
            value: function handleMutations(mutations) {
                var _this4 = this;

                mutations.forEach(function (mutation) {
                    _this4.getRemoved(mutation.removedNodes);
                    _this4.getAdded(mutation.addedNodes);
                });
            }
        }, {
            key: "getAdded",
            value: function getAdded(addedNodes) {
                var nodes = flatten(addedNodes);
                nodes = nodes.filter(function (node) {
                    return node.querySelectorAll;
                }).map(this.getAllElements).filter(function (nodes) {
                    return nodes.length > 0;
                });
                nodes = flatten(nodes);
                nodes = unique(nodes);
                if (nodes.length > 0) {
                    return this.onAdded.emit(nodes);
                } else {
                    return [];
                }
            }
        }, {
            key: "getRemoved",
            value: function getRemoved(removedNodes) {
                var nodes = flatten(removedNodes);
                nodes = nodes.filter(function (node) {
                    return node.querySelectorAll;
                }).map(this.getAllElements).filter(function (nodes) {
                    return nodes.length > 0;
                });
                nodes = flatten(nodes);
                nodes = unique(nodes);
                if (nodes.length > 0) {
                    return this.onRemoved.emit(nodes);
                } else {
                    return [];
                }
            }
        }, {
            key: "dispose",
            value: function dispose() {
                this.observer.disconnect();
                this.onAdded.disconnectAll();
                this.onRemoved.disconnectAll();
                this.observer = null;
                this.onAdded = null;
                this.onRemoved = null;
            }
        }]);

        return DomWatcher;
    }();

    /**
     * Created by mgobbi on 31/03/2017.
     */
    var REG_EXP = /[xy]/g;
    var STRING = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    /**
     *
     * @return {string}
     */
    var nextUid = function nextUid() {
        return STRING.replace(REG_EXP, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === "x" ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    };

    /**
     * Created by marco.gobbi on 21/01/2015.
     */

    var MediatorHandler = function () {
        function MediatorHandler() {
            var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            _classCallCheck(this, MediatorHandler);

            var _params$definitions = params.definitions,
                definitions = _params$definitions === undefined ? {} : _params$definitions,
                _params$dispatcher = params.dispatcher,
                dispatcher = _params$dispatcher === undefined ? new EventTarget$1() : _params$dispatcher;

            this.definitions = definitions;
            this.dispatcher = dispatcher;
            this.MEDIATORS_CACHE = [];
        }

        _createClass(MediatorHandler, [{
            key: "getDefinition",
            value: function getDefinition(node) {
                return this.definitions[node.getAttribute(this.selector)];
            }
        }, {
            key: "inCache",
            value: function inCache(node) {
                return !!find(function (disposable) {
                    return disposable.node === node;
                }, this.MEDIATORS_CACHE);
            }
        }, {
            key: "updateCache",
            value: function updateCache(disposable) {
                this.MEDIATORS_CACHE.push(disposable); //[mediatorId] = disposeFunction;
                return this.MEDIATORS_CACHE;
            }
        }, {
            key: "hasMediator",
            value: function hasMediator(node) {
                return !!this.getDefinition(node) && !this.inCache(node);
            }
        }, {
            key: "findMediator",
            value: function findMediator(load, node) {
                var _this5 = this;

                return load(this.getDefinition(node)).then(function (Mediator) {
                    return _this5.create(node, Mediator);
                }).then(this.updateCache.bind(this));
            }
        }, {
            key: "create",
            value: function create(node, Mediator) {
                var mediatorId = nextUid();
                node.setAttribute("mediatorid", mediatorId);
                var disposable = {
                    mediatorId: mediatorId,
                    node: node,
                    dispose: noop
                };
                if (node.parentNode) {

                    var dispose = Mediator(node, this.dispatcher) || noop;
                    disposable = {
                        mediatorId: mediatorId,
                        node: node,
                        dispose: dispose
                    };
                }
                return disposable;
            }
        }, {
            key: "getAllElements",
            value: function getAllElements(node) {
                var nodes = [].slice.call(node.querySelectorAll("[" + this.selector + "]"), 0);
                if (node.getAttribute(this.selector)) {
                    nodes.unshift(node);
                }
                return nodes;
            }
        }, {
            key: "disposeMediator",
            value: function disposeMediator(disposable) {
                if (disposable) {
                    disposable.dispose();
                    disposable.node = null;
                }
            }
        }, {
            key: "_destroy",
            value: function _destroy(node) {
                var l = this.MEDIATORS_CACHE.length;
                for (var i = 0; i < l; i++) {
                    var disposable = this.MEDIATORS_CACHE[i];
                    if (disposable) {
                        if (!disposable.node || disposable.node === node) {
                            disposable.dispose && disposable.dispose();
                            disposable.node = null;
                            this.MEDIATORS_CACHE[i] = null;
                        }
                    } else {

                        this.MEDIATORS_CACHE[i] = null;
                    }
                }

                return this.MEDIATORS_CACHE.filter(function (i) {
                    return i;
                });
            }
        }, {
            key: "destroy",
            value: function destroy(node) {
                this.MEDIATORS_CACHE = this._destroy(node);
                return this.MEDIATORS_CACHE;
            }
        }, {
            key: "dispose",
            value: function dispose() {
                this.MEDIATORS_CACHE.forEach(this.disposeMediator);
                this.MEDIATORS_CACHE = null;
                this.dispatcher.listeners_ = null;
                this.dispatcher = null;
            }
        }, {
            key: "selector",
            get: function get() {
                return "data-mediator";
            }
        }]);

        return MediatorHandler;
    }();

    var Bootstrap = function () {
        function Bootstrap(options) {
            _classCallCheck(this, Bootstrap);

            var definitions = options.definitions,
                _options$loader = options.loader,
                loader = _options$loader === undefined ? new AMDLoader() : _options$loader,
                _options$root = options.root,
                root = _options$root === undefined ? document.body : _options$root;


            this.definitions = definitions;
            this.loader = loader;
            this.root = root;
            /**
             *
             * @type {MediatorHandler}
             */
            this.handler = options.handler || new MediatorHandler({ definitions: definitions });
            /**
             *
             * @type {DomWatcher}
             */
            this.domWatcher = options.domWatcher || new DomWatcher(root, this.handler.getAllElements.bind(this.handler));
            this.domWatcher.onAdded.connect(this.handleAdded.bind(this));
            this.domWatcher.onRemoved.connect(this.handleRemoved.bind(this));

            this.init();
        }

        _createClass(Bootstrap, [{
            key: "init",
            value: function init() {

                var nodes = [this.root].map(this.handler.getAllElements.bind(this.handler));
                this.promise = this.getMediators(nodes);
            }
        }, {
            key: "handleAdded",
            value: function handleAdded(node) {
                var _this6 = this;

                var nodes = flatten(node);
                nodes = filter(this.handler.hasMediator.bind(this.handler), nodes);
                var promises = map(function (node) {
                    return _this6.loader.load(_this6.handler.getDefinition(node)).then(function (Mediator) {
                        return _this6.handler.create(node, Mediator);
                    }).then(_this6.handler.updateCache.bind(_this6.handler));
                }, nodes);
                return Promise.all(promises);
            }
        }, {
            key: "handleRemoved",
            value: function handleRemoved(nodes) {
                nodes.forEach(this.handler.destroy.bind(this.handler));
            }
        }, {
            key: "getMediators",
            value: function getMediators(nodes) {
                nodes = flatten(nodes);
                var promises = nodes.filter(this.handler.hasMediator.bind(this.handler)).map(this.handler.findMediator.bind(this.handler, this.loader.load.bind(this.loader)));

                return Promise.all(promises);
            }
        }, {
            key: "dispose",
            value: function dispose() {
                this.domWatcher.dispose();
                this.handler.dispose();
                this.domWatcher = null;
                this.handler = null;

                this.definitions = null;
                this.loader = null;
                this.root = null;
                this.promise = null;
            }
        }]);

        return Bootstrap;
    }();

    //
    // export default options => {
    //
    //
    //     let getMediators = GetMediators(handler.findMediator(loader.load), handler.hasMediator);
    //
    //
    //     let promise = Build(getMediators, handler.getAllElements)(root);
    //
    //     return {
    //         promise: promise
    //         , dispose: function () {
    //             domWatcher.dispose();
    //             handler.dispose();
    //             domWatcher = null;
    //             handler = null;
    //             getMediators = null;
    //             definitions = null;
    //             loader = null;
    //             root = null;
    //             promise = null;
    //         }
    //     };
    //
    // };

    //

    var bootstrap = function bootstrap(options) {
        return new Bootstrap(options);
    };

    exports.bootstrap = bootstrap;
    exports.Loader = Loader;
    exports.EventTarget = EventTarget$1;
    exports.Signal = Signal;
    exports.DomWatcher = DomWatcher;
    exports.MediatorHandler = MediatorHandler;
    exports.Bootstrap = Bootstrap;
});
