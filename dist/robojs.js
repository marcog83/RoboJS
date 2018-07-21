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
            value: function onComplete() {
                //not implemented
            }
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

    var CustomLoader = function (_Loader2) {
        _inherits(CustomLoader, _Loader2);

        function CustomLoader(fn) {
            _classCallCheck(this, CustomLoader);

            var _this3 = _possibleConstructorReturn(this, (CustomLoader.__proto__ || Object.getPrototypeOf(CustomLoader)).call(this));

            _this3.fn = fn;
            return _this3;
        }

        _createClass(CustomLoader, [{
            key: "onComplete",
            value: function onComplete(id, resolve, reject) {
                this.fn(id, resolve, reject);
            }
        }]);

        return CustomLoader;
    }(Loader);

    var _root = (typeof self === "undefined" ? "undefined" : _typeof(self)) === "object" && self.self === self && self || (typeof global === "undefined" ? "undefined" : _typeof(global)) === "object" && global.global === global && global || window || self;

    var EventDispatcher = function () {
        function EventDispatcher() {
            _classCallCheck(this, EventDispatcher);

            this.listeners_ = {};
        }

        _createClass(EventDispatcher, [{
            key: "addEventListener",
            value: function addEventListener(type, handler) {

                // let listeners_type = this.listeners_[type];
                if (!this.listeners_[type]) {
                    this.listeners_[type] = [];
                }
                if (!this.listeners_[type].includes(handler)) {
                    this.listeners_[type].push(handler);
                }
            }
        }, {
            key: "removeEventListener",
            value: function removeEventListener(type, handler) {

                var listeners_type = this.listeners_[type];
                if (listeners_type === undefined) return;
                for (var i = 0, l; l = listeners_type[i]; i++) {
                    if (l === handler) {
                        listeners_type.splice(i, 1);
                        break;
                    }
                }if (!listeners_type.length) {
                    delete this.listeners_[type];
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

                var listeners_type = this.listeners_[type];
                if (listeners_type === undefined) return true;

                var handlers = listeners_type.concat();

                handlers.map(function (handler) {
                    return handler.handleEvent ? handler.handleEvent.bind(handler) : handler;
                }).forEach(function (handler) {
                    prevented = handler(event) === false;
                });

                return !prevented && !event.defaultPrevented;
            }
        }]);

        return EventDispatcher;
    }();

    //


    var _EventTarget = _root.EventTarget;

    try {
        new _EventTarget();
    } catch (e) {
        _EventTarget = EventDispatcher;
    }
    var EventTarget = _EventTarget;

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
                    if (this.listenerBoxes[i].listener === slot && this.listenerBoxes[i].scope === scope) {
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
                var _this4 = this;

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                this.listenersNeedCloning = true;
                this.listenerBoxes.forEach(function (_ref) {
                    var scope = _ref.scope,
                        listener = _ref.listener,
                        once = _ref.once;

                    if (once) {
                        _this4.disconnect(listener, scope);
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
    function flatten(arr) {
        return Array.from(arr).reduce(function (flat, toFlatten) {
            if (_isArrayLike(toFlatten)) {
                toFlatten = Array.from(toFlatten);
            }
            return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
        }, []);
    }

    function unique(arrArg) {
        return arrArg.filter(function (elem, pos, arr) {
            return arr.indexOf(elem) === pos;
        });
    }

    var DomWatcher = function () {
        function DomWatcher(root, handler) {
            _classCallCheck(this, DomWatcher);

            this.onAdded = new Signal();
            this.onRemoved = new Signal();
            this.root = root;
            this.handler = handler;
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
                var _this5 = this;

                mutations.forEach(function (mutation) {
                    _this5.updateNodes(mutation.removedNodes, _this5.onRemoved);
                    _this5.updateNodes(mutation.addedNodes, _this5.onAdded);
                });
            }
        }, {
            key: "_parseNodes",
            value: function _parseNodes(nodes) {
                nodes = flatten(nodes);
                nodes = nodes.filter(function (node) {
                    return node.querySelectorAll;
                }).map(this.handler.getAllElements.bind(this.handler)).filter(function (nodes) {
                    return nodes.length > 0;
                });
                nodes = flatten(nodes);
                nodes = unique(nodes);
                return nodes;
            }
        }, {
            key: "updateNodes",
            value: function updateNodes(nodes, signal) {
                nodes = this._parseNodes(nodes);
                if (nodes.length > 0) {
                    signal.emit(nodes);
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

    var _noop = function _noop(_) {
        return _;
    };

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

    var AHandler = function () {
        function AHandler(params) {
            _classCallCheck(this, AHandler);

            var definitions = params.definitions,
                _params$dispatcher = params.dispatcher,
                dispatcher = _params$dispatcher === undefined ? new EventTarget() : _params$dispatcher;

            this.definitions = definitions;
            this.dispatcher = dispatcher;
        }

        _createClass(AHandler, [{
            key: "getDefinition",
            value: function getDefinition() {
                // do nothing.
            }
        }, {
            key: "inCache",
            value: function inCache() {
                // do nothing.
            }
        }, {
            key: "updateCache",
            value: function updateCache() {
                // do nothing.

            }
        }, {
            key: "hasMediator",
            value: function hasMediator() {
                // do nothing.
            }
        }, {
            key: "create",
            value: function create() {
                // do nothing.
            }
        }, {
            key: "getAllElements",
            value: function getAllElements() {
                // do nothing.
            }
        }, {
            key: "destroy",
            value: function destroy() {
                // do nothing.
            }
        }, {
            key: "dispose",
            value: function dispose() {
                // do nothing.

            }
        }]);

        return AHandler;
    }();

    var Disposable = function Disposable() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref2$mediatorId = _ref2.mediatorId,
            mediatorId = _ref2$mediatorId === undefined ? "" : _ref2$mediatorId,
            _ref2$node = _ref2.node,
            node = _ref2$node === undefined ? null : _ref2$node,
            _ref2$dispose = _ref2.dispose,
            dispose = _ref2$dispose === undefined ? _noop : _ref2$dispose;

        _classCallCheck(this, Disposable);

        this.mediatorId = mediatorId;
        this.node = node;
        this.dispose = dispose;
    };

    var MediatorHandler = function (_AHandler) {
        _inherits(MediatorHandler, _AHandler);

        function MediatorHandler(params) {
            _classCallCheck(this, MediatorHandler);

            var _this6 = _possibleConstructorReturn(this, (MediatorHandler.__proto__ || Object.getPrototypeOf(MediatorHandler)).call(this, params));

            _this6.MEDIATORS_CACHE = [];
            return _this6;
        }

        _createClass(MediatorHandler, [{
            key: "getDefinition",
            value: function getDefinition(node) {
                return this.definitions[node.getAttribute(this.selector)];
            }
        }, {
            key: "inCache",
            value: function inCache(node) {
                return !!this.MEDIATORS_CACHE.find(function (disposable) {
                    return disposable.node === node;
                });
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
            key: "create",
            value: function create(node, Mediator) {

                var mediatorId = nextUid();
                node.setAttribute("mediatorid", mediatorId);
                var dispose = _noop;

                if (node.parentNode) {
                    dispose = Mediator(node, this.dispatcher) || _noop;
                }
                var disposable = new Disposable({
                    mediatorId: mediatorId,
                    node: node,
                    dispose: dispose
                });
                this.updateCache(disposable);
                return disposable;
            }
        }, {
            key: "getAllElements",
            value: function getAllElements(node) {
                var nodes = Array.from(node.querySelectorAll("[" + this.selector + "]")).slice(0);
                if (node.getAttribute(this.selector)) {
                    nodes.unshift(node);
                }
                return nodes;
            }
        }, {
            key: "_destroy",
            value: function _destroy(node) {
                var l = this.MEDIATORS_CACHE.length;

                for (var i = 0; i < l; i++) {
                    var disposable = this.MEDIATORS_CACHE[i];
                    if (disposable && (!disposable.node || disposable.node === node)) {
                        MediatorHandler.disposeMediator(disposable);
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
                this.MEDIATORS_CACHE.forEach(MediatorHandler.disposeMediator);
                this.MEDIATORS_CACHE = null;

                this.dispatcher = null;
            }
        }, {
            key: "selector",
            get: function get() {
                return "data-mediator";
            }
        }], [{
            key: "disposeMediator",
            value: function disposeMediator(disposable) {
                disposable.dispose();
                disposable.node = null;
            }
        }]);

        return MediatorHandler;
    }(AHandler);

    var Robo = function () {
        function Robo(options) {
            _classCallCheck(this, Robo);

            var definitions = options.definitions,
                _options$loader = options.loader,
                loader = _options$loader === undefined ? new AMDLoader() : _options$loader,
                _options$root = options.root,
                root = _options$root === undefined ? document.body : _options$root;


            this.definitions = definitions;
            this.loader = loader;
            this.root = root;

            this.handler = options.handler || new MediatorHandler({ definitions: definitions });

            this.watcher = options.watcher || new DomWatcher(root, this.handler);
            this.watcher.onAdded.connect(this.getMediators.bind(this));
            this.watcher.onRemoved.connect(this.removeMediators.bind(this));

            this.init();
        }

        _createClass(Robo, [{
            key: "init",
            value: function init() {

                var nodes = [this.root].map(this.handler.getAllElements.bind(this.handler));
                this.promise = this.getMediators(nodes);
            }
        }, {
            key: "getMediators",
            value: function getMediators(nodes) {
                var _this7 = this;

                nodes = flatten(nodes);
                var promises = nodes.filter(this.handler.hasMediator.bind(this.handler)).map(function (node) {
                    var definition = _this7.handler.getDefinition(node);
                    return _this7.loader.load(definition).then(function (Mediator) {
                        return _this7.handler.create(node, Mediator);
                    });
                });
                return Promise.all(promises);
            }
        }, {
            key: "removeMediators",
            value: function removeMediators(nodes) {
                nodes.forEach(this.handler.destroy.bind(this.handler));
            }
        }, {
            key: "dispose",
            value: function dispose() {
                this.watcher.dispose();
                this.handler.dispose();
                this.watcher = null;
                this.handler = null;

                this.definitions = null;
                this.loader = null;
                this.root = null;
                this.promise = null;
            }
        }]);

        return Robo;
    }();

    var CustomElementHandler = function (_AHandler2) {
        _inherits(CustomElementHandler, _AHandler2);

        function CustomElementHandler(params) {
            _classCallCheck(this, CustomElementHandler);

            var _this8 = _possibleConstructorReturn(this, (CustomElementHandler.__proto__ || Object.getPrototypeOf(CustomElementHandler)).call(this, params));

            _this8.REGISTERED_ELEMENTS = {};

            return _this8;
        }

        _createClass(CustomElementHandler, [{
            key: "updateCache",
            value: function updateCache(id) {
                this.REGISTERED_ELEMENTS[id] = true;
                return this.REGISTERED_ELEMENTS;
            }
        }, {
            key: "inCache",
            value: function inCache(id) {
                return !!this.REGISTERED_ELEMENTS[id];
            }
        }, {
            key: "getDefinition",
            value: function getDefinition(node) {
                return this.definitions[node.tagName.toLowerCase()];
            }
        }, {
            key: "create",
            value: function create(node, Mediator) {
                var tagName = "";
                var dispatcher = this.dispatcher;
                if (!this.inCache(node.tagName.toLowerCase())) {
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

                    this.updateCache(tagName);
                }
                return new Disposable();
            }
        }, {
            key: "hasMediator",
            value: function hasMediator(node) {
                var id = node.tagName.toLowerCase();
                return !!this.getDefinition(node) && !this.inCache(id);
            }
        }, {
            key: "getAllElements",
            value: function getAllElements(node) {
                var _children = Array.from(node.querySelectorAll("*")).filter(function (el) {
                    return el.tagName.match(/-/gim);
                });
                var root = [];
                if (node.tagName.match(/-/gim)) {
                    root = [node];
                }
                return root.concat(_children);
            }
        }]);

        return CustomElementHandler;
    }(AHandler);

    //

    var bootstrap = function bootstrap(options) {
        return new Robo(options);
    };

    exports.bootstrap = bootstrap;
    exports.Loader = Loader;
    exports.AMDLoader = AMDLoader;
    exports.CustomLoader = CustomLoader;
    exports.EventTarget = EventTarget;
    exports.Signal = Signal;
    exports.DomWatcher = DomWatcher;
    exports.MediatorHandler = MediatorHandler;
    exports.Robo = Robo;
    exports.CustomElementHandler = CustomElementHandler;
});
